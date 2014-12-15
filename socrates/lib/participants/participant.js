'use strict';

var conf = require('simple-configure');

function Participant(object) {
  this.state = object || {};
}

module.exports = Participant;