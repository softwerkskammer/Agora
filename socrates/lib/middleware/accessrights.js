'use strict';
var moment = require('moment-timezone');
var conf = require('simple-configure');
var Member = conf.get('beans').get('member');

module.exports = function accessrights(req, res, next) {
  res.locals.accessrights = {
    req: req,

    member: function () {
      return this.req.user && this.req.user.member;
    },

    memberId: function () {
      return this.isRegistered() ? this.member().id() : null;
    },

    isRegistered: function () {
      return !!this.member();
    },

    isMember: function (member) {
      return this.isRegistered() && this.memberId() === member.id();
    },

    isSuperuser: function () {
      return false; // we do not have a superuser mechanism yet
    },

    canEditMember: function (member) {
      return this.isMember(member);
    },

    canDeleteMember: function (member) {
      return this.isSuperuser() && !this.isMember(member);
    }

  };
  next();
};
