"use strict";
var moment = require('moment-timezone');
var addonlocals = require('./addon-locals');
var globallocals = require('./global-locals');

module.exports = {
  language: 'de',
  t: globallocals.t,
  accessrights: globallocals.accessrights,
  user: globallocals.user,
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
    addonConfig: function () {return addonlocals.addonConfig; }
  },
  groups: []
};
