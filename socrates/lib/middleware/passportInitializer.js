'use strict';
var beans = require('simple-configure').get('beans');
var passport = require('passport');
var memberstore = beans.get('memberstore');
var subscriberstore = beans.get('subscriberstore');

function serializeUser(user, done) {
  if (user.profile) {
    return done(null, user);
  }
  delete user.member;
  return done(null, user);
}

function deserializeUser(user, done) {
  if (user.profile) { return done(null, user); } // new user
  memberstore.getMemberForAuthentication(user.authenticationId, function (err, member) {
    if (err) { return done(err); }
    subscriberstore.getSubscriber(member.id(), function (err1, subscriber) {
      if (err1) { return done(err1); }
      done(null, {authenticationId: user.authenticationId, member: member, subscriber: subscriber});
    });
  });
}

passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);



module.exports = [passport.initialize(), passport.session()];
