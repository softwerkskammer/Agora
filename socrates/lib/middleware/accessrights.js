'use strict';
var moment = require('moment-timezone');
var conf = require('nconf');
var Member = conf.get('beans').get('member');

module.exports = function accessrights(req, res, next) {
  res.locals.accessrights = {
    req: req,

    member: function () {
      return this.req.user.member;
    },

    memberId: function () {
      return this.isRegistered() ? this.member().id() : null;
    },

    isAuthenticated: function () {
      return this.req.user && this.req.user.member;
    },

    isRegistered: function () {
      return this.isAuthenticated() && !!this.member();
    },

    isMember: function (member) {
      return this.isAuthenticated() && this.memberId() === member.id();
    },

    canEditMember: function (member) {
      return this.isMember(member);
    }

  };
  next();
};
