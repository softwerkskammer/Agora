/* eslint strict: [2, "global"] */
'use strict';
var moment = require('moment-timezone');

var addonConfig = {
  addonInformation: function () { return 'addonInformation'; },
  addonInformationHTML: function () { return 'addonInformationHTML'; },
  homeAddress: function () { return 'yes'; },
  billingAddress: function () { return 'yes'; },
  tShirtSize: function () { return 'yes'; },
  roommate: function () { return 'yes'; },
  deposit: function () { return ''; }
};

module.exports = {
  language: 'de',
  t: function (string) { return string; },
  accessrights: {
    isRegistered: function () { return true; },
    isMember: function () { return true; },
    isSuperuser: function () { return false; }
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
    resourceNames: function () { return []; },
    addonConfig: function () {return addonConfig; }
  },
  groups: [],
  announcement: {
    id: '',
    thruMoment: function () { return moment(); }
  },
  group: {
  },
  allTypes: ['Themengruppe', 'Regionalgruppe'],
  organizersChecked: [],
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
    interestsForSelect2: function () { return []; },
    site: function () { return ''; },
    reference: function () { return ''; },
    notifyOnWikiChanges: function () { return ''; },
    authentications: function () { return []; },
    socratesOnly: function () { return false; }
  },
  regionalgroups: [],
  themegroups: [],
  paymentInfo: {
    paymentDone: function () { return false; },
    paymentKey: function () { return 'paymentKey'; }
  }
};
