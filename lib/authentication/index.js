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

function expressViewHelper(req, res, next) {
  res.locals.user = req.user;
  res.locals.currentUrl = req.url;
  next();
}

function secureByLogin(req, res, next) {
  var path = req.originalUrl;
  if (securedByLoginURLRegex.test(path)) {
    ensureLoggedIn(req, res, next);
  }
  else {
    next();
  }
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

function setReturnOnSuccess(req, res, next) {
  if (typeof(req.session.returnTo) === 'undefined') {
    req.session.returnTo = getReturnOnSuccess(req);
  }
  next();
}

function authenticate(provider) {
  return passport.authenticate(provider, { successReturnToOrRedirect: '/', failureRedirect: '/auth/login' });
}

function createProviderAuthenticationRoutes(app, provider) {
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
        customHeaders: {"User-Agent" : "agora node server"}
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
      var url = getReturnOnSuccess(req);
      if (securedByLoginURLRegex.test(url)) {
        res.redirect("/");
      }
      else if (url !== req.url) {
        res.redirect(url);
      }
    });
    setupStrategies(app);
    return app;
  },

  configure: function (app) {
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(secureByLogin);
    app.use(expressViewHelper);
  },

  secureByLogin: secureByLogin
};
