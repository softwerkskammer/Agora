'use strict';

var passport = require('passport');
var winston = require('winston');
var jwt = require('jwt-simple');
var moment = require('moment-timezone');
var logger = winston.loggers.get('authorization');

var conf = require('simple-configure');
var beans = conf.get('beans');
var membersService = beans.get('membersService');
var misc = beans.get('misc');

var urlPrefix = conf.get('publicUrlPrefix');
var jwt_secret = conf.get('jwt_secret');

function createUserObject(req, authenticationId, profile, done) {
  if (req.session.callingAppReturnTo) { // we're invoked from another app -> don't add a member to the session
    return done(null, {authenticationId: authenticationId});
  }
  process.nextTick(membersService.findMemberFor(req.user, authenticationId, function (err, member) {
    if (err) { return done(err); }
    if (!member) { return done(null, {authenticationId: authenticationId, profile: profile}); }
    return done(null, {authenticationId: authenticationId, member: member});
  }));
}

function createUserObjectFromGithub(req, accessToken, refreshToken, profile, done) {
  createUserObject(req, profile.provider + ':' + profile.id, profile, done);
}

function createProviderAuthenticationRoutes(app, provider) {

  function authenticate() {
    return passport.authenticate(provider, {successReturnToOrRedirect: '/', failureRedirect: '/login'});
  }

  function setReturnOnSuccess(req, res, next) {
    if (req.session.returnTo === undefined) {
      req.session.returnTo = req.param('returnTo', '/');
    }
    next();
  }

  app.get('/' + provider, setReturnOnSuccess, authenticate());
  app.get('/' + provider + '/callback', authenticate());

  function setReturnViaIdentityProviderOnSuccess(req, res, next) {
    req.session.returnTo = '/auth/idp_return_point';
    req.session.callingAppReturnTo = req.param('returnTo', '/');
    if (req.user && req.user.member) { // save current member info -> restore it later
      req.session.currentAgoraUser = {authenticationId: req.user.authenticationId};
    }
    next();
  }

  function redirectToCallingApp(req, res) {
    var returnTo = req.session.callingAppReturnTo;
    delete req.session.callingAppReturnTo;
    var jwt_token = jwt.encode({
      userId: req.user.authenticationId,
      returnTo: returnTo,
      expires: moment().add(5, 'seconds').toJSON()
    }, jwt_secret);
    if (req.session.currentAgoraUser) { // restore current member info:
      req._passport.session.user = req.session.currentAgoraUser;
      delete req.session.currentAgoraUser;
    } else { // log out:
      delete req._passport.session.user;
    }
    res.redirect(conf.get('socratesURL') + '/auth/loggedIn' + '?id_token=' + jwt_token);
  }

  app.get('/idp/' + provider, setReturnViaIdentityProviderOnSuccess, authenticate());
  app.get('/idp_return_point', redirectToCallingApp);
}

function setupOpenID(app) {
  var OpenIDStrategy = require('passport-openid').Strategy;
  passport.use(new OpenIDStrategy(
    { // openID can always be used
      returnURL: urlPrefix + '/auth/openid/callback',
      realm: urlPrefix,
      profile: true,
      passReqToCallback: true
    },
    createUserObject
  ));
  createProviderAuthenticationRoutes(app, 'openid');
}

function setupGithub(app) {
  var githubClientID = conf.get('githubClientID');
  if (githubClientID) {
    var GithubStrategy = require('passport-github').Strategy;
    var strategy = new GithubStrategy(
      {
        clientID: githubClientID,
        clientSecret: conf.get('githubClientSecret'),
        callbackURL: urlPrefix + '/auth/github/callback',
        customHeaders: {'User-Agent': 'agora node server'},
        passReqToCallback: true
      },
      createUserObjectFromGithub
    );
    strategy._oauth2.useAuthorizationHeaderforGET(true);
    passport.use(strategy);
    createProviderAuthenticationRoutes(app, 'github');
  }
}

var app = misc.expressAppIn(__dirname);

app.get('/logout', function (req, res) {
  req.logout();
  if (req.isAuthenticated && req.isAuthenticated()) {
    logger.info('Had to log out twice. IE problem?' + (req.user ? ' - User was: ' + req.user.authenticationId : ''));
    req.logout();
  }
  res.redirect('/goodbye.html');
});
setupOpenID(app);
setupGithub(app);

module.exports = app;
