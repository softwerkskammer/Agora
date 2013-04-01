"use strict";

var passport = require('passport'),
  OpenIDStrategy = require('passport-openid').Strategy,
  GitHubStrategy = require('passport-github').Strategy,
  path = require('path');

function expressViewHelper(req, res, next) {
  res.locals.user = req.user;
  next();
}

module.exports.configure = function (app) {
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(expressViewHelper);
};

function findOrCreateUser(identifier, profile, done) {
  process.nextTick(function () {
    if (!profile.displayName && profile.username) {
      profile.displayName = profile.username;
    }
    return done(null, { identifier: identifier, profile: profile});
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
        realm: conf.get('publicUrlPrefix'),
        profile: true
      },
      findOrCreateUser
    ));
    app.post('/openid', authenticate('openid'), redirectToRoot);
    app.get('/openid/return', authenticate('openid'), redirectToRoot);
  }
  var githubCallbackPath = conf.get('githubCallbackPath');
  if (githubCallbackPath) {
    passport.use(new GitHubStrategy({
        clientID: conf.get('githubClientID'),
        clientSecret: conf.get('githubClientSecret'),
        callbackURL: conf.get('publicUrlPrefix') + githubCallbackPath
      },
      findOrCreateUserByOAuth
    ));
    app.get('/github', passport.authenticate('github'));
    app.get('/github/callback', authenticate('github'), redirectToRoot);
  }
}

module.exports.initialize = function (app, conf) {
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
};

module.exports.ensureAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/login');
};
