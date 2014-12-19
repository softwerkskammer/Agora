'use strict';

var beans = require('simple-configure').get('beans');
var _ = require('lodash');
var persistence = beans.get('participantsPersistence');
var Participant = beans.get('participant');
var misc = beans.get('misc');
var toParticipant = _.partial(misc.toObject, Participant);

var toParticipantList = function (callback, err, result) {
  if (err) { return callback(err); }
  callback(null, _.map(result, function (each) { return new Participant(each); }));
};

module.exports = {
  allParticipants: function (callback) {
    persistence.list({}, _.partial(toParticipantList, callback));
  },

  getParticipant: function (id, callback) {
    persistence.getById(id, _.partial(toParticipant, callback));
  },

  saveParticipant: function (participant, callback) {
    persistence.save(participant.state, callback);
  }
};