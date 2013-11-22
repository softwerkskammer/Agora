"use strict";
var conf = require('nconf');

module.exports = function accessrights(req, res, next) {
  res.locals.accessrights = {
    req: req,

    member: function () {
      return this.req.user.member;
    },

    memberId: function () {
      return this.isRegistered() ? this.member().id : null;
    },

    isAuthenticated: function () {
      return !!this.req.isAuthenticated && this.req.isAuthenticated();
    },

    isRegistered: function () {
      return this.isAuthenticated() && !!this.member();
    },

    isAdmin: function () {
      return this.isRegistered() && this.member().isAdmin;
    },

    isSuperuser: function () {
      return conf.get('superuser').indexOf(this.memberId()) > -1;
    },

    canCreateActivity: function () {
      return this.isRegistered();
    },

    canEditActivity: function (activity) {
      return this.isAdmin() || activity.owner() === this.memberId();
    },

    canCreateAnnouncement: function () {
      return this.isAdmin();
    },

    canEditAnnouncement: function () {
      return this.isAdmin();
    },

    canCreateGroup: function () {
      return this.isAdmin();
    },

    canEditGroup: function () {
      return this.isAdmin();
    },

    canEditMember: function (member) {
      return this.isSuperuser() || this.isMember(member);
    },

    isMember: function (member) {
      return this.isAuthenticated() && this.memberId() === member.id;
    },

    canCreateColor: function () {
      return this.isAdmin();
    },

    canViewGroupDetails: function () {
      return this.isAuthenticated();
    },

    canParticipateInGroup: function () {
      return this.isAuthenticated();
    }

  };
  next();
};
