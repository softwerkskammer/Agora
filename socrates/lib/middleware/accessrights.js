'use strict';
const conf = require('simple-configure');
const beans = conf.get('beans');
const Member = beans.get('member');

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

    isMember: function isMember(member) {
      return this.isRegistered() && this.memberId() === member.id();
    },

    isSuperuser: function isSuperuser() {
      return Member.isSuperuser(this.memberId()); // same superusers as in SWK
    },

    isSoCraTesAdmin: function isSoCraTesAdmin() { // superusers are automatically SoCraTes admins
      return this.isRegistered() && (conf.get('socratesAdmins').indexOf(this.memberId()) > -1 || this.isSuperuser());
    },

    canEditMember: function canEditMember(member) {
      return this.isSuperuser() || this.isMember(member);
    },

    canDeleteMember: function canDeleteMember(memberOrSubscriber) {
      return this.isSuperuser() && !this.isMember(memberOrSubscriber);
    },

    canCreateActivity: function canCreateActivity() {
      return this.isSuperuser();
    },

    canEditActivity: function canEditActivity() {
      return this.isSoCraTesAdmin();
    },

    canDeleteActivity: function canDeleteActivity() {
      return this.isSuperuser();
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
