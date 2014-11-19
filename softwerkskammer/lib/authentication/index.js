'use strict';

var passport = require('passport');
var winston = require('winston');
var jwt = require('jwt-simple');
var logger = winston.loggers.get('authorization');

var conf = require('nconf');
var beans = conf.get('beans');
var membersService = beans.get('membersService');
var misc = beans.get('misc');

var urlPrefix = conf.get('publicUrlPrefix');
var jwt_secret = conf.get('jwt_secret');

function findOrCreateUser(req, authenticationId, profile, done) {
  if (req.session.socrates_returnTo) {
    return done(null, {authenticationId: authenticationId});
  }
  process.nextTick(membersService.findOrCreateMemberFor(req.user, authenticationId, profile, done));
}

function findOrCreateUserByOAuth(req, accessToken, refreshToken, profile, done) {
  findOrCreateUser(req, profile.provider + ':' + profile.id, profile, done);
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
    req.session.callingAppReturnTo = conf.get('socratesURL') + '/' + req.param('returnTo', '/');
    next();
  }

  function redirectToCallingApp(req, res) {
    var returnTo = req.session.callingAppReturnTo;
    delete req.session.callingAppReturnTo;
    var jwt_token = jwt.encode({userId: req.user.authenticationId}, jwt_secret);
    delete req.user;
    delete req._passport.session.user;
    res.redirect(returnTo + '?id_token=' + jwt_token);
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
    findOrCreateUser
  ));
  createProviderAuthenticationRoutes(app, 'openid');
}

function setupGitHub(app) {
  var githubClientID = conf.get('githubClientID');
  if (githubClientID) {
    var GitHubStrategy = require('passport-github').Strategy;
    var strat = new GitHubStrategy(
      {
        clientID: githubClientID,
        clientSecret: conf.get('githubClientSecret'),
        callbackURL: urlPrefix + '/auth/github/callback',
        customHeaders: {'User-Agent': 'agora node server'},
        passReqToCallback: true
      },
      findOrCreateUserByOAuth
    );
    strat._oauth2.useAuthorizationHeaderforGET(true);
    passport.use(strat);
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
setupGitHub(app);

module.exports = app;
