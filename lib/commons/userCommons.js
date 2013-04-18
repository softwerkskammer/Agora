"use strict";

var urlPrefix = require('nconf').get('publicUrlPrefix');

module.exports = {
  isUserRegistered: function (req) {
    return req.user && req.user.member;
  },

  redirectIfNotAdmin: function (req, res, callback, nicknameOfEditMember) {
    if (this.isUserRegistered(req) && (req.user.member.isAdmin || req.user.member.nickname === nicknameOfEditMember)) {
      return callback();
    }
    res.redirect(urlPrefix + '/');
  }

};
