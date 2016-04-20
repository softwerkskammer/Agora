/* eslint no-underscore-dangle: 0 */
'use strict';

var passport = require('passport');
var logger = require('winston').loggers.get('authorization');

var conf = require('simple-configure');
var beans = conf.get('beans');
var authenticationService = beans.get('authenticationService');
var misc = beans.get('misc');

var urlPrefix = conf.get('publicUrlPrefix');


function createProviderAuthenticationRoutes(app1, provider) {

  function authenticate() {
    return passport.authenticate(provider, {successReturnToOrRedirect: '/', failureRedirect: '/login'});
  }

  function setReturnOnSuccess(req, res, next) {
    if (req.session.returnTo === undefined) {
      req.session.returnTo = req.query.returnTo || '/';
    }
    next();
  }

  app1.get('/' + provider, setReturnOnSuccess, authenticate());
  app1.get('/' + provider + '/callback', authenticate());

  function setReturnViaIdentityProviderOnSuccess(req, res, next) {
    req.session.returnTo = '/auth/idp_return_point';
    req.session.callingAppReturnTo = req.query.returnTo || '/';
    if (req.user && req.user.member) { // save current member info -> restore it later
      req.session.currentAgoraUser = {authenticationId: req.user.authenticationId};
    }
    next();
  }

  app1.get('/idp/' + provider, setReturnViaIdentityProviderOnSuccess, authenticate());
  app1.get('/idp_return_point', authenticationService.redirectToCallingApp);
}

function setupOpenID(app1) {
  var OpenIDStrategy = require('passport-openid').Strategy;
  passport.use(new OpenIDStrategy(
    { // openID can always be used
      returnURL: urlPrefix + '/auth/openid/callback',
      realm: urlPrefix,
      profile: true,
      passReqToCallback: true
    },
    authenticationService.createUserObjectFromOpenID
  ));
  createProviderAuthenticationRoutes(app1, 'openid');
}

function setupGithub(app1) {
  var githubClientID = conf.get('githubClientID');
  if (githubClientID) {
    var GithubStrategy = require('passport-github').Strategy;
    var strategy = new GithubStrategy(
      {
        clientID: githubClientID,
        clientSecret: conf.get('githubClientSecret'),
        callbackURL: urlPrefix + '/auth/github/callback',
        customHeaders: {'User-Agent': 'agora node server'},
        passReqToCallback: true
      },
      authenticationService.createUserObjectFromGithub
    );
    strategy._oauth2.useAuthorizationHeaderforGET(true);
    passport.use(strategy);
    createProviderAuthenticationRoutes(app1, 'github');
  }
}

function setupGooglePlus(app1) {
  var googlePlusClientID = conf.get('googlePlusClientID');
  if (googlePlusClientID) {
    var GooglePlusStrategy = require('openidconnect-for-passport').Strategy;

    var strategy = new GooglePlusStrategy(
      {
        authorizationURL: 'https://accounts.google.com/o/oauth2/auth',
        tokenURL: 'https://www.googleapis.com/oauth2/v3/token',
        clientID: googlePlusClientID,
        clientSecret: conf.get('googlePlusClientSecret'),
        callbackURL: urlPrefix + '/auth/openidconnect/callback',
        userInfoURL: 'https://www.googleapis.com/plus/v1/people/me',

        scope: 'email profile',
        skipUserProfile: false,

        passReqToCallback: true
      },
      authenticationService.createUserObjectFromGooglePlus
    );
    strategy.authorizationParams = function () {
      return {
        'openid.realm': urlPrefix
      };
    };

    passport.use(strategy);
    createProviderAuthenticationRoutes(app1, strategy.name);
  }
}

var app = misc.expressAppIn(__dirname);

app.get('/logout', function (req, res) {
  req.logout();
  if (req.isAuthenticated && req.isAuthenticated()) {
    logger.info('Had to log out twice. IE problem?' + (req.user ? ' - User was: ' + req.user.authenticationId : ''));
    req.logout();
  }
  res.redirect('/goodbye.html');
});

setupOpenID(app);
setupGithub(app);
setupGooglePlus(app);

module.exports = app;
