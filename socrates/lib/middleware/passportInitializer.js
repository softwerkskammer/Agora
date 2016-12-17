'use strict';
const beans = require('simple-configure').get('beans');
const passport = require('passport');
const memberstore = beans.get('memberstore');
const subscriberstore = beans.get('subscriberstore');

function serializeUser(user, done) {
  if (user.profile) {
    return done(null, user);
  }
  delete user.member;
  return done(null, user);
}

function deserializeUser(user, done) {
  if (user.profile) { return done(null, user); } // new user
  memberstore.getMemberForAuthentication(user.authenticationId, (err, member) => {
    if (err) { return done(err); }
    subscriberstore.getSubscriber(member.id(), (err1, subscriber) => {
      if (err1) { return done(err1); }
      done(null, {authenticationId: user.authenticationId, member, subscriber});
    });
  });
}

passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);

module.exports = [passport.initialize(), passport.session()];
