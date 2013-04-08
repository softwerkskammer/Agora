"use strict";

module.exports = function (conf) {

  var passport = require('passport'),
    OpenIDStrategy = require('passport-openid').Strategy,
    GitHubStrategy = require('passport-github').Strategy,
    path = require('path'),
    ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn('/auth/login'),
    memberstore = require('../members/memberstore.js')(conf),
    urlPrefix = conf.get('publicUrlPrefix'),
    securedByLoginURLRegex = new RegExp(conf.get('securedByLoginURLPattern'));

  function expressViewHelper(req, res, next) {
    res.locals.user = req.user;
    next();
  }

  function secureByLogin(req, res, next) {
    var path = req.originalUrl;
    if (securedByLoginURLRegex.test(path)) {
      if (req.user && !req.user.registered && path !== '/members/new') {
        res.redirect(urlPrefix + '/members/new');
      }
      else {
        ensureLoggedIn(req, res, next);
      }
    }
    else {
      next();
    }
  }

  function findOrCreateUser(identifier, profile, done) {
    process.nextTick(function () {
      memberstore.getMemberForId(identifier, function (err, result) {
        var user = { identifier: identifier, profile: profile};
        if (result) {
          user.registered = true;
        }
        return done(null, user);
      });
    });
  }

  function findOrCreateUserByOAuth(accessToken, refreshToken, profile, done) {
    findOrCreateUser(profile.provider + ':' + profile.id, profile, done);
  }

  function serializeUser(user, done) {
    done(null, user);
  }

  function deserializeUser(user, done) {
    done(null, user);
  }

  function authenticate(provider) {
    return passport.authenticate(provider, { successReturnToOrRedirect: '/', failureRedirect: urlPrefix + '/auth/login' });
  }

  function createProviderAuthenticationRoutes(app, provider) {
    app.get('/' + provider, authenticate(provider));
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
      passport.use(new GitHubStrategy({
          clientID: githubClientID,
          clientSecret: conf.get('githubClientSecret'),
          callbackURL: urlPrefix + '/auth/github/callback'
        },
        findOrCreateUserByOAuth
      ));
      createProviderAuthenticationRoutes(app, 'github');
    }
  }

  function setupStrategies(app) {
    setupOpenID(app);
    setupGitHub(app);
  }

  return {
    initialize: function (app) {
      passport.serializeUser(serializeUser);
      passport.deserializeUser(deserializeUser);
      app.set('views', path.join(__dirname, 'views'));
      app.set('view engine', 'jade');
      app.get('/login', function (req, res) {
        res.render('login');
      });
      app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
      });
      setupStrategies(app);
      return app;
    },

    configure: function (app) {
      app.use(passport.initialize());
      app.use(passport.session());
      app.use(secureByLogin);
      app.use(expressViewHelper);
    }
  };
};
