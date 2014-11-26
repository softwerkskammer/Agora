'use strict';

var jwt = require('jwt-simple');
var passport = require('passport');
var winston = require('winston');
var logger = winston.loggers.get('authorization');

var conf = require('nconf');
var beans = conf.get('beans');
var misc = beans.get('misc');
var jwt_secret = conf.get('jwt_secret');

var participantService = beans.get('participantService');
var memberstore = beans.get('memberstore');

var app = misc.expressAppIn(__dirname);

app.get('/loggedIn', function (req, res, next) {

  function getTokenFrom(req) {
    return jwt.decode(req.query.id_token, jwt_secret);
  }

  function createUserObject(token, callback) {
    if (!token.userId) {
      return callback(new Error("Authentication failed."));
    }
    // load member and participant:
    // TODO (siehe membersService.findMemberFor ??)
    memberstore.getMemberForAuthentication(token.userId, function (err, member) {
      if (err) { return callback(err); }
      // no member: this person+auth is unknown in SWK
      if (!member) { return callback(null, {authenticationId: token.userId, profile: token.profile}); }
      // no participant: this person+auth is known in SWK but not in SoCraTes
      return callback(null, {authenticationId: token.userId, member: member});
    });
  }

  createUserObject(getTokenFrom(req), function (err, userObject) {
    if (err) { return next(err); }

    req._passport.session.user = userObject;
    passport.authenticate('session')(req, res, function () {
      if (req.user.member) {
        return participantService.createParticipantIfNecessaryFor(req.user.member.id(), function (err) {
          if (err) { return next(err); }
          res.redirect('/');
        });
      }
      res.redirect('/registration/editmember');
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
