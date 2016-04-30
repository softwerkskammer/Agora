/*eslint no-underscore-dangle: 0*/
'use strict';

var R = require('ramda');
var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');
var fieldHelpers = beans.get('fieldHelpers');

var e = beans.get('eventConstants');
var memoize = require('../eventstore/flushableMemoize');


function SoCraTesReadModel(eventStore) {
  this._eventStore = eventStore;

  // read model state:
  this._startTimeInMillis = undefined;
  this._endTimeInMillis = undefined;
  this._quota = {};
}

var projectUrl = function (url, event) { return event.event === e.URL_WAS_SET ? event.url : url; };

SoCraTesReadModel.prototype.url = memoize(function () {
  return R.reduce(projectUrl, undefined, this._eventStore.socratesEvents());
});

var projectStartTime = function (startTimeInMillis, event) { return event.event === e.START_TIME_WAS_SET ? event.startTimeInMillis : startTimeInMillis; };

SoCraTesReadModel.prototype.startTime = memoize(function () {
  var _startTimeInMillis = R.reduce(projectStartTime, undefined, this._eventStore.socratesEvents()); // this is a projection :-)
  return moment(_startTimeInMillis).tz(fieldHelpers.defaultTimezone());
});

var projectEndTime = function (endTimeInMillis, event) { return event.event === e.END_TIME_WAS_SET ? event.endTimeInMillis : endTimeInMillis; };

SoCraTesReadModel.prototype.endTime = memoize(function () {
  var _endTimeInMillis = R.reduce(projectEndTime, undefined, this._eventStore.socratesEvents());

  return moment(_endTimeInMillis).tz(fieldHelpers.defaultTimezone());
});


var projectQuota = function (roomType, quota, event) { return event.event === e.ROOM_QUOTA_WAS_SET && event.roomType === roomType ? event.quota : quota; };

SoCraTesReadModel.prototype.quotaFor = memoize(function (roomType) {
  return R.reduce(R.partial(projectQuota, [roomType]), undefined, this._eventStore.socratesEvents());
});

SoCraTesReadModel.prototype.id = function () {
  return this._eventStore.id();
};

module.exports = SoCraTesReadModel;
