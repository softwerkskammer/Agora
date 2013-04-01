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
    return passport.authenticate(provider, { failureRedirect: '/auth/login' });
  }

  var redirectToRoot = function (req, res) {
    res.redirect('/');
  };

  function setupStrategies(app, conf) {
    var openIdReturnPath = conf.get('openidReturnPath');
    if (openIdReturnPath) {
      passport.use(new OpenIDStrategy({
          returnURL: conf.get('publicUrlPrefix') + openIdReturnPath,
          realm    : conf.get('publicUrlPrefix'),
          profile  : true
        },
        findOrCreateUser
      ));

      app.post('/openid', authenticate('openid'), redirectToRoot);
      app.get('/openid/return', authenticate('openid'), function (req, res) {
        if (req.user.registered) {
          res.redirect('/');
        } else {
          res.redirect('../../members/new');
        }
      });

    }
    var githubCallbackPath = conf.get('githubCallbackPath');
    if (githubCallbackPath) {
      passport.use(new GitHubStrategy({
          clientID    : conf.get('githubClientID'),
          clientSecret: conf.get('githubClientSecret'),
          callbackURL : conf.get('publicUrlPrefix') + githubCallbackPath
        },
        findOrCreateUserByOAuth
      ));

      app.post('/github', authenticate('github'), redirectToRoot);
      app.get('/github/callback', authenticate('github'), function (req, res) {
        if (req.user.registered) {
          res.redirect('/');
        } else {
          res.redirect('../../members/new');
        }
      });

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
