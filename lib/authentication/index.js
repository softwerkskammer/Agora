"use strict";

module.exports = function (conf) {

  var passport = require('passport'),
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
    return passport.authenticate(provider, { failureRedirect: '/auth/login' });
  }

  var redirectAfterAuthentication =  function (req, res) {
    if (req.user.registered) {
      res.redirect('/');
    } else {
      res.redirect('../../members/new');
    }
  };

  function createProviderAuthenticationRoutes(app, provider, path, returnPath) {
    app.get(path, authenticate(provider));
    app.get(returnPath, authenticate(provider), redirectAfterAuthentication);
  }

  function setupStrategies(app, conf) {
    var openIdReturnPath = conf.get('openidReturnPath');
    if (openIdReturnPath) {
      var OpenIDStrategy = require('passport-openid').Strategy;
      passport.use(new OpenIDStrategy({
          returnURL: conf.get('publicUrlPrefix') + openIdReturnPath,
          realm    : conf.get('publicUrlPrefix'),
          profile  : true
        },
        findOrCreateUser
      ));
      createProviderAuthenticationRoutes(app, 'openid', '/openid', '/openid/return');
    }

    var githubCallbackPath = conf.get('githubCallbackPath');
    if (githubCallbackPath) {
      var GitHubStrategy = require('passport-github').Strategy;
      passport.use(new GitHubStrategy({
          clientID    : conf.get('githubClientID'),
          clientSecret: conf.get('githubClientSecret'),
          callbackURL : conf.get('publicUrlPrefix') + githubCallbackPath
        },
        findOrCreateUserByOAuth
      ));
      createProviderAuthenticationRoutes(app, 'github', '/github', '/github/callback');
    }
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

    ensureAuthenticated: function (req, res, next) {
      if (req.isAuthenticated()) {
        return next();
      }
      res.redirect('/auth/login');
    },

    configure: function (app) {
      app.use(passport.initialize());
      app.use(passport.session());
      app.use(expressViewHelper);
    }
  };
};
