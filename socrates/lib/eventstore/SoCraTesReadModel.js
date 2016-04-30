/*eslint no-underscore-dangle: 0*/
'use strict';

var R = require('ramda');
var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');
var fieldHelpers = beans.get('fieldHelpers');
var roomOptions = beans.get('roomOptions');

var e = beans.get('eventConstants');

function SoCraTesReadModel(eventStore) {
  this._eventStore = eventStore;

  // read model state:
  this._url = undefined;
  this._startTimeInMillis = undefined;
  this._endTimeInMillis = undefined;
  this._quota = {};

  this.update(this._eventStore.socratesEvents());
}

var projectUrl = function (url, event) { return event.event === e.URL_WAS_SET ? event.url : url; };
var projectStartTime = function (startTimeInMillis, event) { return event.event === e.START_TIME_WAS_SET ? event.startTimeInMillis : startTimeInMillis; };
var projectEndTime = function (endTimeInMillis, event) { return event.event === e.END_TIME_WAS_SET ? event.endTimeInMillis : endTimeInMillis; };
var projectQuota = function (roomType, quota, event) { return event.event === e.ROOM_QUOTA_WAS_SET && event.roomType === roomType ? parseInt(event.quota, 10) : quota; };

SoCraTesReadModel.prototype.update = function (events) {
  // these are our projections :-)
  this._url = R.reduce(projectUrl, this._url, events);
  this._startTimeInMillis = R.reduce(projectStartTime, this._startTimeInMillis, events);
  this._endTimeInMillis = R.reduce(projectEndTime, this._endTimeInMillis, events);
  roomOptions.allIds().forEach(roomType => {
    this._quota[roomType] = R.reduce(R.partial(projectQuota, [roomType]), this._quota[roomType], events);
  });
};

SoCraTesReadModel.prototype.url = function () {
  return this._url;
};

SoCraTesReadModel.prototype.startTime = function () {
  return moment(this._startTimeInMillis).tz(fieldHelpers.defaultTimezone());
};

SoCraTesReadModel.prototype.endTime = function () {
  return moment(this._endTimeInMillis).tz(fieldHelpers.defaultTimezone());
};

SoCraTesReadModel.prototype.quotaFor = function (roomType) {
  return this._quota[roomType];
};

SoCraTesReadModel.prototype.id = function () {
  return this._eventStore.id();
};

module.exports = SoCraTesReadModel;
