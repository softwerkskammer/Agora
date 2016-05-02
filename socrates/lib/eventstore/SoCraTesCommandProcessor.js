/*eslint no-underscore-dangle: 0*/
'use strict';

var R = require('ramda');

var beans = require('simple-configure').get('beans');
var fieldHelpers = beans.get('fieldHelpers');
var misc = beans.get('misc');

var events = beans.get('events');
var roomOptions = beans.get('roomOptions');

function SoCraTesCommandProcessor(writeModel) {
  this.writeModel = writeModel;
}

SoCraTesCommandProcessor.prototype.setConferenceDetails = function (uiData) {
  function matchArrayEntries(input) {
    return R.zipObj(misc.toArray(input.names), misc.toArray(input.limits));
  }

  var evts = [];
  evts.push(events.urlWasSet(uiData.url));
  var startMoment = fieldHelpers.parseToMomentUsingDefaultTimezone(uiData.startDate, uiData.startTime);
  evts.push(events.startTimeWasSet(startMoment));
  var endMoment = fieldHelpers.parseToMomentUsingDefaultTimezone(uiData.endDate, uiData.endTime);
  evts.push(events.endTimeWasSet(endMoment));

  // update quotas:
  var newQuotas = matchArrayEntries(uiData.resources);
  roomOptions.allIds().forEach(roomType => evts.push(events.roomQuotaWasSet(roomType, newQuotas[roomType])));

  return evts;
};

SoCraTesCommandProcessor.prototype.updateEventStore = function (newEvents) {
  if (!(newEvents instanceof Array)) {
    newEvents = [newEvents];
  }
  this.writeModel.updateSoCraTesEvents(newEvents);
};

SoCraTesCommandProcessor.prototype.eventStore = function () {
  return this.writeModel.eventStore();
};

module.exports = SoCraTesCommandProcessor;
