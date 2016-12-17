'use strict';
const beans = require('simple-configure').get('beans');
const passport = require('passport');
const memberstore = beans.get('memberstore');

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
    done(null, {authenticationId: user.authenticationId, member});
  });
}

passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);

module.exports = [passport.initialize(), passport.session()];
