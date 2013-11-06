"use strict";

module.exports = function accessrights(req, res, next) {
  res.locals.accessrights = {
    req: req,

    isAuthenticated: function () {
      return this.req.isAuthenticated && this.req.isAuthenticated();
    },

    isRegistered: function () {
      return this.isAuthenticated() && this.req.user.member;
    },

    isAdmin: function () {
      return this.isAuthenticated() && this.req.user.member && this.req.user.member.isAdmin;
    },

    canCreateAnnouncement: function () {
      return this.isAdmin();
    },

    canEditAnnouncement: function () {
      return this.isAdmin();
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

    canCreateGroup: function () {
      return this.isAdmin();
    },

    canEditGroup: function () {
      return this.isAdmin();
    },

    canEditMember: function (member) {
      return this.isAdmin() || this.isMember(member);
    },

    isMember: function (member) {
      return this.isAuthenticated() && this.req.user.member.id === member.id;
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
