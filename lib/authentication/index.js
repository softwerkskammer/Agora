"use strict";

var passport = require('passport');
var path = require('path');
var conf = require('nconf');
var membersAPI = conf.get('beans').get('membersAPI');
var winston = require('winston');
var logger = winston.loggers.get('application');
var urlPrefix = conf.get('publicUrlPrefix');

function findOrCreateUser(identifier, profile, done) {
  process.nextTick(function () {
    var user = { identifier: identifier, profile: profile};
    done(null, user);
  });
}

function findOrCreateUserByOAuth(accessToken, refreshToken, profile, done) {
  findOrCreateUser(profile.provider + ':' + profile.id, profile, done);
}

function createProviderAuthenticationRoutes(app, provider) {
  function authenticate(provider) {
    return passport.authenticate(provider, { successReturnToOrRedirect: '/', failureRedirect: '/login' });
  }

  function setReturnOnSuccess(req, res, next) {
    if (typeof(req.session.returnTo) === 'undefined') {
      req.session.returnTo = req.param("returnTo", "/");
    }
    next();
  }

  app.get('/' + provider, setReturnOnSuccess, authenticate(provider));
  app.get('/' + provider + '/callback', authenticate(provider));
}

function setupStrategies(app) {
  function setupOpenID(app) {
    var OpenIDStrategy = require('passport-openid').Strategy;
    passport.use(new OpenIDStrategy({ // openID can always be used
        returnURL: urlPrefix + '/auth/openid/callback',
        realm: urlPrefix,
        profile: true
      },
      findOrCreateUser
    ));
    createProviderAuthenticationRoutes(app, 'openid');
  }

  function setupGitHub(app) {
    var githubClientID = conf.get('githubClientID');
    if (githubClientID) {
      var GitHubStrategy = require('passport-github').Strategy;
      var strat = new GitHubStrategy({
          clientID: githubClientID,
          clientSecret: conf.get('githubClientSecret'),
          callbackURL: urlPrefix + '/auth/github/callback',
          customHeaders: {"User-Agent": "agora node server"}
        },
        findOrCreateUserByOAuth
      );
      strat._oauth2.useAuthorizationHeaderforGET(true);
      passport.use(strat);
      createProviderAuthenticationRoutes(app, 'github');
    }
  }

  setupOpenID(app);
  setupGitHub(app);
}

module.exports = function (app) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  function serializeUser(user, done) {
    user.member = null;
    done(null, user);
  }

  function deserializeUser(user, done) {
    membersAPI.getMemberForId(user.identifier, function (err, result) {
      // ignoring error here
      if (result) {
        user.member = result;
      }
      done(null, user);
    });
  }

  passport.serializeUser(serializeUser);
  passport.deserializeUser(deserializeUser);
  app.get('/logout', function (req, res) {
    req.logout();
    if (req.isAuthenticated && req.isAuthenticated()) {
      logger.info('Had to log out twice. IE problem?' + (req.user ? ' - User was: ' + req.user.identifier : ''));
      req.logout();
    }
    res.redirect('/goodbye.html');
  });
  setupStrategies(app);
  return app;
};
