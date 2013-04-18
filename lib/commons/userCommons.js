"use strict";

var nconf = require('nconf');
var urlPrefix = nconf.get('publicUrlPrefix');

module.exports = {
  userIsRegistered: function (req) {
    return req && req.user && req.user.member;
  },

  redirectIfNotAdmin: function (req, res, callback) {
    if (!this.userIsRegistered(req) || !req.user.member.isAdmin) {
      return res.redirect(urlPrefix + '/');
    }
    callback();
  }
};
