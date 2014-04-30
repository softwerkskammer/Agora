"use strict";
var moment = require('moment-timezone');
var globallocals = require('./global-locals');

module.exports = {
  language: 'de',
  t: globallocals.t,
  accessrights: globallocals.accessrights,
  user: globallocals.user,
  group: {
    id: ''
  },
  allTypes: ['Themengruppe', 'Regionalgruppe'],
  organizersChecked: []
};
