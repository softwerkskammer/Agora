"use strict";
var moment = require('moment-timezone');
var addonlocals = require('./addon-locals');
var globallocals = require('./global-locals');

module.exports = {
  language: 'de',
  t: globallocals.t,
  accessrights: globallocals.accessrights,
  user: globallocals.user,
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
    authentications: function () { return []; }
  },
  regionalgroups: [],
  themegroups: []
};
