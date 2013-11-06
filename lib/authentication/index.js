"use strict";

var passport = require('passport');
var path = require('path');
var conf = require('nconf');
var membersAPI = conf.get('beans').get('membersAPI');
var winston = require('winston');
var logger = winston.loggers.get('authorization');
var urlPrefix = conf.get('publicUrlPrefix');

function findOrCreateUser(req, authenticationId, profile, done) {
  process.nextTick(function () {
    if (!req.user) {
      return membersAPI.getMemberForAuthentication(authenticationId, function (err, member) {
        if (err) { return done(err); }
        if (!member) { return done(null, { authenticationId: authenticationId, profile: profile }); }
        done(null, {authenticationId: authenticationId, member: member});
      });
    }
    var memberOfSession = req.user.member;
    return membersAPI.getMemberForAuthentication(authenticationId, function (err, member) {
      if (err) { return done(err); }
      if (member && memberOfSession.id !== member.id) { return done(new Error('Unter dieser Authentifizierung existiert schon ein Mitglied.')); }
      if (member && memberOfSession.id === member.id) { return done(null, {authenticationId: authenticationId, member: member}); }
      // no member found
      memberOfSession.addAuthentication(authenticationId);
      membersAPI.saveMember(memberOfSession, function (err, member) {
        if (err) { return done(err); }
        done(null, {authenticationId: authenticationId, member: member});
      });
    });
  });
}

function findOrCreateUserByOAuth(req, accessToken, refreshToken, profile, done) {
  findOrCreateUser(req, profile.provider + ':' + profile.id, profile, done);
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
        profile: true,
        passReqToCallback: true
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
          customHeaders: {"User-Agent": "agora node server"},
          passReqToCallback: true
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
    done(null, user);
  }

  function deserializeUser(user, done) {
    if (user.profile) { return done(null, user); } // new user
    membersAPI.getMemberForAuthentication(user.authenticationId, function (err, member) {
      if (err) { return done(err); }
      done(null, {authenticationId: user.authenticationId, member: member});
    });
  }

  passport.serializeUser(serializeUser);
  passport.deserializeUser(deserializeUser);

  app.get('/logout', function (req, res) {
    req.logout();
    if (req.isAuthenticated && req.isAuthenticated()) {
      logger.info('Had to log out twice. IE problem?' + (req.user ? ' - User was: ' + req.user.authenticationId : ''));
      req.logout();
    }
    res.redirect('/goodbye.html');
  });
  setupStrategies(app);
  return app;
};
