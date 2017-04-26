/*eslint no-underscore-dangle: 0*/
'use strict';

const R = require('ramda');
const moment = require('moment-timezone');

const beans = require('simple-configure').get('beans');
const fieldHelpers = beans.get('fieldHelpers');
const roomOptions = beans.get('roomOptions');

const e = beans.get('eventConstants');

function processUrl(url, event) { return event.event === e.URL_WAS_SET ? event.url : url; }
function processStartTime(startTimeInMillis, event) { return event.event === e.START_TIME_WAS_SET ? event.startTimeInMillis : startTimeInMillis; }
function processEndTime(endTimeInMillis, event) { return event.event === e.END_TIME_WAS_SET ? event.endTimeInMillis : endTimeInMillis; }
function processQuota(roomType, quota, event) { return event.event === e.ROOM_QUOTA_WAS_SET && event.roomType === roomType ? parseInt(event.quota, 10) : quota; }

class SoCraTesReadModel {

  constructor(events) {

    // read model state:
    this._url = undefined;
    this._startTimeInMillis = undefined;
    this._endTimeInMillis = undefined;
    this._quota = {};

    this.process(events);
  }

  process(events) {
    // these are our projections :-)
    this._url = R.reduce(processUrl, this._url, events);
    this._startTimeInMillis = R.reduce(processStartTime, this._startTimeInMillis, events);
    this._endTimeInMillis = R.reduce(processEndTime, this._endTimeInMillis, events);
    roomOptions.allIds().forEach(roomType => {
      this._quota[roomType] = R.reduce(R.partial(processQuota, [roomType]), this._quota[roomType], events);
    });
  }

  url() {
    return this._url;
  }

  startTime() {
    return moment(this._startTimeInMillis).tz(fieldHelpers.defaultTimezone());
  }

  endTime() {
    return moment(this._endTimeInMillis).tz(fieldHelpers.defaultTimezone());
  }

  quotaFor(roomType) {
    return this._quota[roomType];
  }
}

module.exports = SoCraTesReadModel;
