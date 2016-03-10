'use strict';

var beans = require('simple-configure').get('beans');
var events = beans.get('events');



function SoCraTesCommandProcessor(writeModel) {
  this.writeModel = writeModel;
}

SoCraTesCommandProcessor.prototype.updateRoomQuota = function (roomType, quota) {
  var event = events.roomQuotaWasSet(roomType, quota);
  this.writeModel.updateSoCraTesEvents([event]);
};


module.exports = SoCraTesCommandProcessor;
