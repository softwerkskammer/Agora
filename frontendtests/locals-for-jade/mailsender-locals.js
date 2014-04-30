"use strict";
var globallocals = require('./global-locals');

module.exports = {
  t: globallocals.t,
  accessrights: globallocals.accessrights,
  user: globallocals.user,
  message: {
    receiver: ''
  }
};
