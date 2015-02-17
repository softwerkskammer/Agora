'use strict';
var moment = require('moment-timezone');
var Member = require('simple-configure').get('beans').get('member');

module.exports = function accessrights(req, res, next) {
  res.locals.accessrights = {
    req: req,

    member: function () {
      return this.req.user && this.req.user.member;
    },

    isRegistered: function () {
      return !!this.member();
    },

    memberId: function () {
      return this.isRegistered() ? this.member().id() : null;
    },

    isMember: function (member) {
      return this.isRegistered() && this.memberId() === member.id();
    },

    isSuperuser: function () {
      return Member.isSuperuser(this.memberId()); // same superusers as in SWK
    },

    canEditMember: function (member) {
      return this.isMember(member);
    },

    canDeleteMember: function (member) {
      return this.isSuperuser() && !this.isMember(member);
    },

    canCreateActivity: function () {
      return this.isSuperuser();
    },

    canEditActivity: function (activity) {
      return this.isSuperuser();
    },

    canDeleteActivity: function (activity) {
      return this.isSuperuser();
    }

  };
  next();
};
