'use strict';

const jwt = require('jwt-simple');
const passport = require('passport');
const moment = require('moment-timezone');
const logger = require('winston').loggers.get('socrates-authorization');

const conf = require('simple-configure');
const beans = conf.get('beans');
const misc = beans.get('misc');
const jwtSecret = conf.get('jwtSecret');

const subscriberService = beans.get('subscriberService');
const membersService = beans.get('membersService');
const statusmessage = beans.get('statusmessage');

const app = misc.expressAppIn(__dirname);

app.get('/loggedIn', (req, res, next) => {

  function getTokenFrom(req1) {
    return jwt.decode(req1.query.id_token, jwtSecret);
  }

  function createUserObject(token, callback) {
    if (!token.userId) {
      return callback(new Error('Authentication failed.'));
    }
    if (moment(token.expires).isBefore(moment())) {
      return callback(new Error('Authentication failed (expired token).'));
    }
    // load member and subscriber:
    membersService.findMemberFor(null, token.userId, token.oldUserId, (err, member) => {
      if (err) { return callback(err); }
      // no member: this person+auth is unknown in SWK
      if (!member) { return callback(null, {authenticationId: token.userId, profile: token.profile}); }
      // add the member to the session user
      return callback(null, {authenticationId: token.userId, member}, token.returnTo);
    })();
  }

  createUserObject(getTokenFrom(req), (err, userObject, returnTo) => {
    /*eslint no-underscore-dangle: 0*/

    if (err) { return next(err); }
    if (returnTo === '/login') {
      returnTo = req.session.returnTo;
    }
    req._passport.session.user = userObject;
    passport.authenticate('session')(req, res, () => {
      if (req.user.member) {
        return subscriberService.createSubscriberIfNecessaryFor(req.user.member.id(), (err1, subscriberAlreadyExists) => {
          if (err1) { return next(err1); }
          if (!subscriberAlreadyExists) {
            delete req.session.statusmessage; // If the subscriber was not an SWK member, SWK added a "profile saved" message to the session.
            statusmessage.successMessage('general.welcome', 'general.thanks_for_interest').putIntoSession(req);
          }
          res.redirect(returnTo);
        });
      }
      if (req.session.registrationTuple) { // handle new user during participate workflow
        return res.redirect('/registration/participate');
      }
      res.redirect('/members/edit');
    });
  });
});

app.get('/logout', (req, res) => {
  req.logout();
  delete req.session.registrationTuple;
  if (req.isAuthenticated && req.isAuthenticated()) {
    logger.info('SoCraTes: Had to log out twice. IE problem?' + (req.user ? ' - User was: ' + req.user.authenticationId : ''));
    req.logout();
  }
  res.redirect('/goodbye.html');
});

module.exports = app;
