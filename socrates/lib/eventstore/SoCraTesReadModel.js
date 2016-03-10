/*eslint no-underscore-dangle: 0*/
'use strict';

var R = require('ramda');

var beans = require('simple-configure').get('beans');
var e = beans.get('eventConstants');


function SoCraTesReadModel(eventStore) {
  this.eventStore = eventStore;

  // read model state:
  this._quota = {};

}

var updateQuota = function (roomType, quota, event) { return event.event === e.ROOM_QUOTA_WAS_SET && event.roomType === roomType ? event.quota : quota; };

SoCraTesReadModel.prototype.quotaFor = function (roomType) {
  if (!this._quota[roomType]) {
    this._quota[roomType] = R.reduce(R.partial(updateQuota, [roomType]), undefined, this.eventStore.socratesEvents());
  }

  return this._quota[roomType];
};


module.exports = SoCraTesReadModel;
