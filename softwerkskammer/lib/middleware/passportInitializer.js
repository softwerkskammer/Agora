"use strict";
const passport = require("passport");
const memberstore = require("../members/memberstore");

function serializeUser(user, done) {
  if (user.profile) {
    return done(null, user);
  }
  delete user.member;
  return done(null, user);
}

function deserializeUser(user, done) {
  if (user.profile) {
    return done(null, user);
  } // new user
  try {
    const member = memberstore.getMemberForAuthentication(user.authenticationId);
    done(null, { authenticationId: user.authenticationId, member });
  } catch (e) {
    done(e);
  }
}

passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);

module.exports = [passport.initialize(), passport.session()];
