/* eslint strict: [2, "global"] */
'use strict';
var moment = require('moment-timezone');

module.exports = {
  language: 'en',
  t: function (string) { return string; },
  accessrights: {
    isRegistered: function () { return true; },
    isMember: function () { return true; },
    memberId: function () { return ''; }
  },
  socratesReadModel: {
    id: function () { return ''; },
    url: function () { return ''; },
    startTime: function () { return moment(); },
    endTime: function () { return moment(); },
    quotaFor: function () { return 10; }
  },
  registration: {
    isPossible: true,
    queryParam: undefined,
    alreadyRegistered: false,
    selectedOption: undefined,
    alreadyOnWaitinglist: false,
    opening: undefined,
    opensIn: undefined
  },
  roomTypes: ['single', 'bed_in_double', 'junior', 'bed_in_junior'],
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
  subscriber: {
    notifyOnWikiChangesSoCraTes: function () { return true; },
    country: function () {return 'UNKNOWN'; }
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
    deposit: function () { return ''; },
    remarks: function () { return ''; }
  },
  roomOptions: [
    {
      id: 'single',
      name: 'Single',
      two: 200,
      three: 270,
      threePlus: 300,
      four: 370,
      displayRegistrationCheckboxes: true
    },
    {
      id: 'bed_in_double',
      name: 'Double shared …',
      shareable: true,
      two: 160,
      three: 210,
      threePlus: 240,
      four: 290,
      displayRegistrationCheckboxes: true
    },
    {
      id: 'junior',
      name: 'Junior shared …',
      shareable: true,
      two: 151,
      three: 197,
      threePlus: 227,
      four: 272,
      displayRegistrationCheckboxes: true
    },
    {
      id: 'bed_in_junior',
      name: 'Junior (exclusive)',
      two: 242,
      three: 333,
      threePlus: 363,
      four: 454,
      displayRegistrationCheckboxes: true
    }
  ],
  participation: {},
  allCountries: [{iso: 'AA', name: 'Alpha Country'}, {iso: 'ZZ', name: 'Zero Land'}]

};
