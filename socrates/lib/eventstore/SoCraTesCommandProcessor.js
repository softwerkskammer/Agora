/*eslint no-underscore-dangle: 0*/
'use strict';

const R = require('ramda');

const beans = require('simple-configure').get('beans');
const fieldHelpers = beans.get('fieldHelpers');
const misc = beans.get('misc');

const events = beans.get('events');
const roomOptions = beans.get('roomOptions');

class SoCraTesCommandProcessor {
  constructor(writeModel) {
    this.writeModel = writeModel;
  }

  createConferenceEvents(uiData) {
    function matchArrayEntries(input) {
      return R.zipObj(misc.toArray(input.names), misc.toArray(input.limits));
    }

    const evts = [];
    evts.push(events.urlWasSet(uiData.url));
    const startMoment = fieldHelpers.parseToMomentUsingDefaultTimezone(uiData.startDate, uiData.startTime);
    evts.push(events.startTimeWasSet(startMoment));
    const endMoment = fieldHelpers.parseToMomentUsingDefaultTimezone(uiData.endDate, uiData.endTime);
    evts.push(events.endTimeWasSet(endMoment));

    // update quotas:
    const newQuotas = matchArrayEntries(uiData.resources);
    roomOptions.allIds().forEach(roomType => evts.push(events.roomQuotaWasSet(roomType, newQuotas[roomType])));

    return evts;
  }

  eventStore() {
    return this.writeModel.eventStore();
  }
}

module.exports = SoCraTesCommandProcessor;
