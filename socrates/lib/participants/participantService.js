'use strict';

var beans = require('nconf').get('beans');
var memberstore = beans.get('memberstore');
var participantstore = beans.get('participantstore');
var Participant = beans.get('participant');

module.exports = {

  createParticipantIfNecessaryFor: function (id, callback) {
    participantstore.getParticipant(id, function (err, particip) {
      if (err) { return callback(err); }
      if (!particip) {
        return participantstore.saveParticipant(new Participant({id: id}), callback);
      }
      return callback(null);
    });
  }

};