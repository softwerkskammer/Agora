'use strict';
var moment = require('moment-timezone');

module.exports = {
  language: 'en',
  t: function (string) { return string; },
  accessrights: {
    isRegistered: function () { return true; },
    isMember: function () { return true; }
  },
  activity: {
    id: function () { return ''; },
    url: function () { return ''; },
    title: function () { return ''; },
    startMoment: function () { return moment(); },
    endMoment: function () { return moment(); },
    description: function () { return ''; },
    location: function () { return ''; },
    direction: function () { return ''; },
    resourceNames: function () { return []; }
  },
  message: {
    receiver: ''
  },
  member: {
    id: function () { return ''; },
    created: function () { return ''; },
    email: function () { return ''; },
    firstname: function () { return ''; },
    lastname: function () { return ''; },
    nickname: function () { return ''; },
    twitter: function () { return ''; },
    location: function () { return ''; },
    profession: function () { return ''; },
    interests: function () { return ''; },
    site: function () { return ''; },
    reference: function () { return ''; },
    notifyOnWikiChanges: function () { return ''; },
    socratesOnly: function () { return false; },
    authentications: function () { return []; }
  },
  paymentInfo: {
    paymentDone: function () { return false; },
    paymentKey: function () { return 'paymentKey'; }
  },
  addon: {
    addon: function () { return 'addonInformation'; },
    addonInformationHTML: function () { return 'addonInformationHTML'; },
    homeAddress: function () { return 'yes'; },
    billingAddress: function () { return 'yes'; },
    tShirtSize: function () { return 'yes'; },
    roommate: function () { return 'yes'; },
    deposit: function () { return ''; }
  }
};
