"use strict";

module.exports = function (conf) {

  var passport = require('passport'),
    OpenIDStrategy = require('passport-openid').Strategy,
    path = require('path'),
    port = 0,
    memberstore = require('../members/memberstore.js')(conf);

  function expressViewHelper(req, res, next) {
    res.locals.user = req.user;
    next();
  }

  function findOrCreateUserByOpenId(identifier, profile, done) {
    process.nextTick(function () {
      memberstore.getMemberForId(identifier, function (err, result) {
        var member = { identifier: identifier, profile: profile};
        if (result) {
          member.registered = true;
        }
        return done(null, member);
      });
    });
  }

  function serializeUser(user, done) {
    done(null, user);
  }

  function deserializeUser(user, done) {
    done(null, user);
  }

  function configureRoutes(app) {
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');
    app.get('/login', function (req, res) {
      res.render('login');
    });

    app.post('/openid',
      passport.authenticate('openid', { failureRedirect: '/auth/login' }),
      function (req, res) {
        res.redirect('/');
      }
    );

    app.get('/openid/return',
      passport.authenticate('openid', { failureRedirect: '/auth/login' }),
      function (req, res) {
        if (req.user.registered) {
          res.redirect('/');
        } else {
          res.redirect('../../members/new');
        }
      }
    );

    app.get('/logout', function (req, res) {
      req.logout();
      res.redirect('/');
    });
  }

  function setupStrategies(conf) {
    passport.use(new OpenIDStrategy({
        returnURL: conf.get('publicUrlPrefix') + '/auth/openid/return',
        realm    : conf.get('appUrl'),
        profile  : true
      },
      findOrCreateUserByOpenId
    ));
  }

  return {
    initialize: function (app, conf) {
      port = conf.get('port');
      passport.serializeUser(serializeUser);
      passport.deserializeUser(deserializeUser);
      setupStrategies(conf);
      configureRoutes(app);
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