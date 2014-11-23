'use strict';

var conf = require('nconf');

function Participant(object) {
  this.state = object || {};
}

module.exports = Participant;