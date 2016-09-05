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

    isSuperuser: function () {
      return Member.isSuperuser(this.memberId());
    },

    canCreateActivityResult: function () {
      return this.isSuperuser();
    },

    canCreateActivity: function () {
      return this.isRegistered();
    },

    canEditActivity: function (activity) {
      return this.isSuperuser() || (activity.group && activity.group.isOrganizer(this.memberId())) || activity.owner() === this.memberId()
        || activity.editorIds().indexOf(this.memberId()) > -1;
    },

    canDeleteActivity: function (activity) {
      return this.isSuperuser() || (activity.owner() === this.memberId() && activity.startMoment().isAfter(moment()));
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

    canDeleteMember: function (member) {
      return this.isSuperuser() && !this.isMember(member);
    },

    isMember: function (member) {
      return this.isRegistered() && this.memberId() === member.id();
    },

    canViewGroupDetails: function () {
      return this.isRegistered();
    },

    canParticipateInGroup: function () {
      return this.isRegistered();
    },

    canEditPhoto: function (photo) {
      return this.isSuperuser() || (photo && photo.uploadedBy && photo.uploadedBy() === this.memberId());
    },

    canDeletePhoto: function () {
      return this.isSuperuser();
    }

  };
  next();
};
