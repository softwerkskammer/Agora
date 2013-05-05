"use strict";

module.exports = {
  isUserRegistered: function (req) {
    return req.user && req.user.member;
  },

  redirectIfNotAdmin: function (req, res, callback, optionalOverrideCheck) {
    if (optionalOverrideCheck || (this.isUserRegistered(req) && req.user.member.isAdmin)) {
      return callback();
    }
    res.redirect('/');
  }

};
