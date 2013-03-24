"use strict";

var fakes = [
  { id: '1', title: 'Event #1' },
  { id: '2', title: 'Event #2' }
];

module.exports = {
  getEvents: function () {
    return fakes;
  },
  getEvent: function () {
    return fakes[0];
  }
};

