"use strict";
var conf = require('nconf');

module.exports = function accessrights(req, res, next) {
  res.locals.accessrights = {
    req: req,

    member: function () {
      return this.req.user.member;
    },

    isAuthenticated: function () {
      return this.req.isAuthenticated && this.req.isAuthenticated();
    },

    isRegistered: function () {
      return this.isAuthenticated() && this.member();
    },

    isAdmin: function () {
      return this.isRegistered() && this.member().isAdmin;
    },

    isSuperuser: function () {
      return conf.get('superuser').indexOf(this.member().id) > -1;
    },

    canCreateActivity: function () {
      return this.isAdmin();
    },

    canEditActivity: function () {
      return this.isAdmin();
    },

    canParticipateInActivity: function () {
      return this.isAuthenticated();
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
      return this.isAuthenticated() && this.member().id === member.id;
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
