"use strict";

module.exports = function (conf) {

  var passport = require('passport'),
    OpenIDStrategy = require('passport-openid').Strategy,
    GitHubStrategy = require('passport-github').Strategy,
    path = require('path'),
    memberstore = require('../members/memberstore.js')(conf);

  function expressViewHelper(req, res, next) {
    res.locals.user = req.user;
    next();
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
    return passport.authenticate(provider, { successReturnToOrRedirect: '/', failureRedirect: '/auth/login' });
  }

  function createProviderAuthenticationRoutes(app, provider) {
    app.get('/' + provider, authenticate(provider));
    app.get('/' + provider + '/callback', authenticate(provider));
  }

  function setupOpenID(conf, app) {
    passport.use(new OpenIDStrategy({ // openID can always be used
        returnURL: conf.get('publicUrlPrefix') + '/auth/openid/callback',
        realm    : conf.get('publicUrlPrefix'),
        profile  : true
      },
      findOrCreateUser
    ));
    createProviderAuthenticationRoutes(app, 'openid');
  }

  function setupGitHub(conf, app) {
    var githubClientID = conf.get('githubClientID');
    if (githubClientID) {
      passport.use(new GitHubStrategy({
          clientID    : githubClientID,
          clientSecret: conf.get('githubClientSecret'),
          callbackURL : conf.get('publicUrlPrefix') + '/auth/github/callback'
        },
        findOrCreateUserByOAuth
      ));
      createProviderAuthenticationRoutes(app, 'github');
    }
  }

  function setupStrategies(app, conf) {
    setupOpenID(conf, app);
    setupGitHub(conf, app);
  }

  return {
    initialize: function (app, conf) {
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
      setupStrategies(app, conf);
      return app;
    },

    configure: function (app) {
      app.use(passport.initialize());
      app.use(passport.session());
      app.use(expressViewHelper);
    }
  };
};
