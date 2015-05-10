'use strict';

var passport = require('passport');
var jwt = require('jwt-simple');
var moment = require('moment-timezone');
var logger = require('winston').loggers.get('authorization');

var conf = require('simple-configure');
var beans = conf.get('beans');
var membersService = beans.get('membersService');
var misc = beans.get('misc');

var urlPrefix = conf.get('publicUrlPrefix');
var jwtSecret = conf.get('jwtSecret');

function createUserObject(req, authenticationId, legacyAuthenticationId, profile, done) {
  if (req.session.callingAppReturnTo) { // we're invoked from another app -> don't add a member to the session
    return done(null, { authenticationId: { newId: authenticationId, oldId: legacyAuthenticationId, profile: profile } });
  }
  process.nextTick(membersService.findMemberFor(req.user, authenticationId, legacyAuthenticationId, function (err, member) {
    if (err) { return done(err); }
    if (!member) { return done(null, {authenticationId: authenticationId, profile: profile}); }
    return done(null, {authenticationId: authenticationId, member: member});
  }));
}

function createUserObjectFromOpenID(req, authenticationId, profile, done) {
  createUserObject(req, authenticationId, undefined, profile, done);
}

function createUserObjectFromGithub(req, accessToken, refreshToken, profile, done) {
  createUserObject(req, profile.provider + ':' + profile.id, undefined, profile, done);
}

function createUserObjectFromGooglePlus(req, iss, sub, profile, jwtClaims, accessToken, refreshToken, params, done) {
  createUserObject(req, "https://plus.google.com/" + sub, jwtClaims.openid_id, profile._json, done);
}

function createProviderAuthenticationRoutes(app, provider) {

  function authenticate() {
    return passport.authenticate(provider, {successReturnToOrRedirect: '/', failureRedirect: '/login'});
  }

  function setReturnOnSuccess(req, res, next) {
    if (req.session.returnTo === undefined) {
      req.session.returnTo = req.query.returnTo || '/';
    }
    next();
  }

  app.get('/' + provider, setReturnOnSuccess, authenticate());
  app.get('/' + provider + '/callback', authenticate());

  function setReturnViaIdentityProviderOnSuccess(req, res, next) {
    req.session.returnTo = '/auth/idp_return_point';
    req.session.callingAppReturnTo = req.query.returnTo || '/';
    if (req.user && req.user.member) { // save current member info -> restore it later
      req.session.currentAgoraUser = {authenticationId: req.user.authenticationId};
    }
    next();
  }

  function redirectToCallingApp(req, res) {
    var returnTo = req.session.callingAppReturnTo;
    delete req.session.callingAppReturnTo;
    var jwt_token = jwt.encode({
      userId: req.user.authenticationId.newId,
      oldUserId: req.user.authenticationId.oldId,
      profile: req.user.authenticationId.profile,
      returnTo: returnTo,
      expires: moment().add(5, 'seconds').toJSON()
    }, jwtSecret);
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
    createUserObjectFromOpenID
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

function setupGooglePlus(app) {
  var googlePlusClientID = conf.get('googlePlusClientID');
  if (googlePlusClientID) {
    var GooglePlusStrategy = require('passport-openidconnect').Strategy;

    var strategy = new GooglePlusStrategy(
      {
        authorizationURL: 'https://accounts.google.com/o/oauth2/auth',
        tokenURL: 'https://www.googleapis.com/oauth2/v3/token',
        clientID: googlePlusClientID,
        clientSecret: conf.get('googlePlusClientSecret'),
        callbackURL: urlPrefix + '/auth/openidconnect/callback',
        userInfoURL: 'https://www.googleapis.com/plus/v1/people/me',

        scope: 'email profile',
        skipUserProfile: false,

        passReqToCallback: true
      },
      createUserObjectFromGooglePlus
    );
    strategy.authorizationParams = function (options) {
      return {
        "openid.realm": urlPrefix
      };
    };

    passport.use(strategy);
    createProviderAuthenticationRoutes(app, strategy.name);
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
setupGooglePlus(app);

module.exports = app;
