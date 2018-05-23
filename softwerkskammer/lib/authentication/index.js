/* eslint no-underscore-dangle: 0 */
'use strict';

const passport = require('passport');
const jwt = require('jsonwebtoken');
const MagicLinkStrategy = require('./magicLinkStrategy');

const logger = require('winston').loggers.get('authorization');

const conf = require('simple-configure');
const beans = conf.get('beans');
const authenticationService = beans.get('authenticationService');
const mailsenderService = beans.get('mailsenderService');
const memberstore = beans.get('memberstore');
const misc = beans.get('misc');

const urlPrefix = conf.get('publicUrlPrefix');

function loginChoiceCookieFor(url) {
  const identifier = 'openid_identifier=';
  if (url.startsWith('/openidconnect?')) {
    return {oidc: true};
  }
  if (url.startsWith('/github?')) {
    return {gh: true};
  }
  if (url.startsWith('/openid?') && url.includes(identifier + 'https://openid.stackexchange.com')) {
    return {se: true};
  }
  if (url.startsWith('/openid?') && url.includes(identifier)) {
    const start = url.indexOf(identifier) + identifier.length;
    let end = url.indexOf('&', start);
    if (end < 0) { end = undefined; }
    return {provider: url.substring(start, end)};
  }
  return {};
}

function createProviderAuthenticationRoutes(app1, strategyName) {

  function authenticate() {
    return passport.authenticate(strategyName, {successReturnToOrRedirect: '/', failureRedirect: '/login'});
  }

  function setLoginCookieOnSuccess(req, res, next) {
    res.cookie('loginChoice', loginChoiceCookieFor(decodeURIComponent(req.url)), {maxAge: 1000 * 60 * 60 * 24 * 365, httpOnly: true}); // expires: Date
    next();
  }

  app1.get('/' + strategyName, setLoginCookieOnSuccess, authenticate());
  app1.get('/' + strategyName + '/callback', authenticate());

}

function setupOpenID(app1) {
  const OpenIDStrategy = require('passport-openid').Strategy;
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
  const githubClientID = conf.get('githubClientID');
  if (githubClientID) {
    const GithubStrategy = require('passport-github').Strategy;
    const strategy = new GithubStrategy(
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
  const googlePlusClientID = conf.get('googlePlusClientID');
  if (googlePlusClientID) {
    const GooglePlusStrategy = require('openidconnect-for-passport').Strategy;

    const strategy = new GooglePlusStrategy(
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

function setupMagicLink(app1) {

  const strategy = new MagicLinkStrategy({
      secret: conf.get('magicLinkSecret'),
      tokenName: 'token'
    },
    authenticationService.createUserObjectFromMagicLink
  );

  passport.use(strategy);
  createProviderAuthenticationRoutes(app1, strategy.name);

  app1.get('/magiclinkmail', (req, res) => {
    const email = req.query.magic_link_email && req.query.magic_link_email.trim();
    if (!email) {
      return res.redirect('magiclinkNoEmail.html');
    }

    memberstore.getMemberForEMail(email, (err, member) => {
      if (err || !member) {return res.redirect('magiclinkNoMember.html');}

      jwt.sign({authenticationId: member.authentications()[0]}, conf.get('magicLinkSecret'), {expiresIn: '30 minutes'}, (err1, token) => {
        if (err1) { return res.redirect('magicLinkCreationProblem.html'); }

        mailsenderService.sendMagicLinkToMember(member, token, err2 => {
          if (err2) { return res.redirect('magicLinkSendingProblem.html'); }

          res.redirect('magiclinkConfirm.html');
        });
      });
    });
  });
}

const app = misc.expressAppIn(__dirname);

app.get('/logout', (req, res) => {
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
setupMagicLink(app);

module.exports = app;
