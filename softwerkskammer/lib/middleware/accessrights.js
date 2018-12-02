'use strict';

const {DateTime} = require('luxon');
const Member = require('simple-configure').get('beans').get('member');

module.exports = function accessrights(req, res, next) {
  res.locals.accessrights = {
    req,

    member: function member() {
      return this.req.user && this.req.user.member;
    },

    isRegistered: function isRegistered() {
      return !!this.member();
    },

    memberId: function memberId() {
      return this.isRegistered() ? this.member().id() : null;
    },

    isSuperuser: function isSuperuser() {
      return Member.isSuperuser(this.memberId());
    },

    canCreateActivityResult: function canCreateActivityResult() {
      return this.isSuperuser();
    },

    canCreateActivity: function canCreateActivity() {
      return this.isRegistered();
    },

    canEditActivity: function canEditActivity(activity) {
      return this.isSuperuser() || (activity.group && activity.group.isOrganizer(this.memberId())) || activity.owner() === this.memberId()
        || activity.editorIds().indexOf(this.memberId()) > -1;
    },

    canDeleteActivity: function canDeleteActivity(activity) {
      return this.isSuperuser() || (activity.owner() === this.memberId() && activity.startDateTime() > DateTime.local());
    },

    canCreateGroup: function canCreateGroup() {
      return this.isRegistered();
    },

    canEditGroup: function canEditGroup(group) {
      return this.isSuperuser() || group.isOrganizer(this.memberId());
    },

    canEditMember: function canEditMember(member) {
      return this.isSuperuser() || this.isMember(member);
    },

    canDeleteMember: function canDeleteMember(member) {
      return this.isSuperuser() && !this.isMember(member);
    },

    canDeleteMemberByNickname: function canDeleteMemberByNickname(nickname) {
      return this.isSuperuser() && !this.isNickname(nickname);
    },

    isMember: function isMember(member) {
      return this.isRegistered() && this.memberId() === member.id();
    },

    isNickname: function isNickname(nickname) {
      return this.isRegistered() && this.member().nickname() === nickname;
    },

    canViewGroupDetails: function canViewGroupDetails() {
      return this.isRegistered();
    },

    canParticipateInGroup: function canParticipateInGroup() {
      return this.isRegistered();
    },

    canEditPhoto: function canEditPhoto(photo) {
      return this.isSuperuser() || (photo && photo.uploadedBy && photo.uploadedBy() === this.memberId());
    },

    canDeletePhoto: function canDeletePhoto() {
      return this.isSuperuser();
    }

  };
  next();
};
