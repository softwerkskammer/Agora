"use strict";

var passport = require('passport'),
  OpenIDStrategy = require('passport-openid').Strategy,
  GitHubStrategy = require('passport-github').Strategy,
  path = require('path'),
  ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn('/auth/login'),
  membersAPI = require('../members/membersAPI.js'),
  conf = require('nconf'),
  urlPrefix = conf.get('publicUrlPrefix'),
  securedByLoginURLRegex = new RegExp(conf.get('securedByLoginURLPattern'));

function secureByLogin(req, res, next) {
  if (securedByLoginURLRegex.test(req.originalUrl)) {
    return ensureLoggedIn(req, res, next);
  }
  next();
}

function findOrCreateUser(identifier, profile, done) {
  process.nextTick(function () {
    var user = { identifier: identifier, profile: profile};
    done(null, user);
  });
}

function findOrCreateUserByOAuth(accessToken, refreshToken, profile, done) {
  findOrCreateUser(profile.provider + ':' + profile.id, profile, done);
}

function serializeUser(user, done) {
  user.member = null;
  done(null, user);
}

function deserializeUser(user, done) {
  membersAPI.getMemberForId(user.identifier, function (err, result) {
    if (result) {
      user.member = result;
    }
    done(null, user);
  });
}

function getReturnOnSuccess(req) {
  return req.param("returnTo", "/");
}

function authenticate(provider) {
  return passport.authenticate(provider, { successReturnToOrRedirect: '/', failureRedirect: '/auth/login' });
}

function createProviderAuthenticationRoutes(app, provider) {
  function setReturnOnSuccess(req, res, next) {
    if (typeof(req.session.returnTo) === 'undefined') {
      req.session.returnTo = getReturnOnSuccess(req);
    }
    next();
  }

  app.get('/' + provider, setReturnOnSuccess, authenticate(provider));
  app.get('/' + provider + '/callback', authenticate(provider));
}

function setupOpenID(app) {
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

function setupStrategies(app) {
  setupOpenID(app);
  setupGitHub(app);
}

module.exports = {
  initialize: function (app) {
    passport.serializeUser(serializeUser);
    passport.deserializeUser(deserializeUser);
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');
    app.get('/login', function (req, res) {
      res.locals.returnToPage = getReturnOnSuccess(req);
      res.render('login');
    });
    app.get('/logout', function (req, res) {
      req.logout();
      res.redirect('/goodbye.html');
    });
    setupStrategies(app);
    return app;
  },

  configure: function (app) {
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(secureByLogin);
  },

  secureByLogin: secureByLogin
};
