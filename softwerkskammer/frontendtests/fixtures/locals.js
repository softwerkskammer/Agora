/* eslint strict: [2, "global"] */
'use strict';
var moment = require('moment-timezone');

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
    veranstaltung: function () {
      return {
        limit: function () { return ''; },
        isRegistrationOpen: function () { return ''; },
        canUnsubscribe: function () { return ''; },
        hasWaitinglist: function () { return ''; }
      };
    },
    clonedFromMeetup: function () { return false; }
  },
  groups: [],
  group: {},
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
  },
  regionalgroups: [],
  themegroups: []
};
