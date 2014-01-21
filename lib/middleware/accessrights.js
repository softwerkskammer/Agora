"use strict";
var conf = require('nconf');

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
      return !!this.req.isAuthenticated && this.req.isAuthenticated();
    },

    isRegistered: function () {
      return this.isAuthenticated() && !!this.member();
    },

    isSuperuser: function () {
      var superusers = conf.get('superuser');
      return superusers && superusers.indexOf(this.memberId()) > -1;
    },

    canCreateActivity: function () {
      return this.isRegistered();
    },

    canEditActivity: function (activity) {
      return this.isSuperuser() || (activity.group && activity.group.isOrganizer(this.memberId())) || activity.owner() === this.memberId();
    },

    canCreateAnnouncement: function () {
      return this.isSuperuser();
    },

    canEditAnnouncement: function () {
      return this.isSuperuser();
    },

    canCreateGroup: function () {
      return this.isRegistered();
    },

    canEditGroup: function (group) {
      return this.isSuperuser() || group.isOrganizer(this.memberId());
    },

    canEditMember: function (member) {
      return this.isSuperuser() || this.isMember(member);
    },

    isMember: function (member) {
      return this.isAuthenticated() && this.memberId() === member.id();
    },

    canCreateColor: function () {
      return this.isSuperuser();
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
