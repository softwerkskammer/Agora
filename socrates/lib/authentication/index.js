'use strict';

var jwt = require('jwt-simple');
var passport = require('passport');
var winston = require('winston');
var moment = require('moment-timezone');
var logger = winston.loggers.get('authorization');

var conf = require('simple-configure');
var beans = conf.get('beans');
var misc = beans.get('misc');
var jwt_secret = conf.get('jwt_secret');

var subscriberService = beans.get('subscriberService');
var membersService = beans.get('membersService');
var memberstore = beans.get('memberstore');

var app = misc.expressAppIn(__dirname);

app.get('/loggedIn', function (req, res, next) {

  function getTokenFrom(req) {
    return jwt.decode(req.query.id_token, jwt_secret);
  }

  function createUserObject(token, callback) {
    if (!token.userId) {
      return callback(new Error('Authentication failed.'));
    }
    if (moment(token.expires).isBefore(moment())) {
      return callback(new Error('Authentication failed (expired token).'));
    }
    // load member and subscriber:
    membersService.findMemberFor(null, token.userId, token.oldUserId, function (err, member) {
      if (err) { return callback(err); }
      // no member: this person+auth is unknown in SWK
      if (!member) { return callback(null, {authenticationId: token.userId, profile: token.profile}); }
      // no participant: this person+auth is known in SWK but not in SoCraTes
      return callback(null, {authenticationId: token.userId, member: member}, token.returnTo);
    })();
  }

  createUserObject(getTokenFrom(req), function (err, userObject, returnTo) {
    if (err) { return next(err); }
    if ('/login' === returnTo) {
      returnTo = req.session.returnTo;
    }
    req._passport.session.user = userObject;
    passport.authenticate('session')(req, res, function () {
      if (req.user.member) {
        return subscriberService.createSubscriberIfNecessaryFor(req.user.member.id(), function (err) {
          if (err) { return next(err); }
          res.redirect(returnTo);
        });
      }
      res.redirect('/members/edit');
    });
  });
});

app.get('/logout', function (req, res) {
  req.logout();
  if (req.isAuthenticated && req.isAuthenticated()) {
    logger.info('SoCraTes: Had to log out twice. IE problem?' + (req.user ? ' - User was: ' + req.user.authenticationId : ''));
    req.logout();
  }
  res.redirect('/goodbye.html');
});

module.exports = app;
