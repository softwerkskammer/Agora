"use strict";

var passport = require('passport'),
  OpenIDStrategy = require('passport-openid').Strategy,
  path = require('path'),
  port = 0;

function expressViewHelper(req, res, next) {
  res.locals.user = req.user;
  next();
}

module.exports.configure = function (app) {
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(expressViewHelper);
};

function findOrCreateUserByOpenId(identifier, profile, done) {
  process.nextTick(function () {
    return done(null, { identifier: identifier,  profile: profile});
  });
}

function setNewOpenIdStrategy(req) {
  var host = req.host,
    returnURL = 'http://' + host + ':' + port + '/auth/openid/return',
    realm = 'http://' + host + ':' + port;
  passport.use(new OpenIDStrategy({
      returnURL: returnURL,
      realm: realm,
      profile: true
    },
    findOrCreateUserByOpenId
  ));
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
    function (req, res, next) {
      setNewOpenIdStrategy(req);
      passport.authenticate('openid', { failureRedirect: '/auth/login' })(req, res, next);
    },
    function (req, res) {
      res.redirect('/');
    }
  );

  app.get('/openid/return',
    function (req, res, next) {
      setNewOpenIdStrategy(req);
      passport.authenticate('openid', { failureRedirect: '/auth/login' })(req, res, next);
    },
    function (req, res) {
      res.redirect('/');
    }
  );

  app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
  });
}

module.exports.initialize = function (app, conf) {
  port = conf.get('port');
  passport.serializeUser(serializeUser);
  passport.deserializeUser(deserializeUser);
  configureRoutes(app);
  return app;
};

module.exports.ensureAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/login');
};
