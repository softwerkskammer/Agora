'use strict';

var beans = require('simple-configure').get('beans');
var Addon = beans.get('socratesAddon');
var Payment = beans.get('socratesPayment');
var Participation = beans.get('socratesParticipation');
var socratesConstants = beans.get('socratesConstants');

function Subscriber(object) {
  this.state = object || {};
}

Subscriber.prototype.fillFromUI = function (uiInputObject) {
  this.addon().fillFromUI(uiInputObject);
  this.currentParticipation().fillFromUI(uiInputObject); // TODO if isParticipating
  return this;
};

Subscriber.prototype.addon = function () {
  if (!this.state._addon) {
    this.state._addon = {};
  }
  return new Addon(this.state._addon);
};

Subscriber.prototype.payment = function () {
  return this.currentParticipation().payment();
};

Subscriber.prototype.participations = function () {
  if (!this.state.participations) {
    this.state.participations = {};
  }
  return this.state.participations;
};

Subscriber.prototype.currentParticipation = function () {
  if (!this.participations()[socratesConstants.currentYear]) {
    this.state.participations[socratesConstants.currentYear] = {};
  }
  return new Participation(this.participations()[socratesConstants.currentYear]);
};

Subscriber.prototype.isParticipating = function () {
  return !!this.participations()[socratesConstants.currentYear];
};

Subscriber.prototype.needsToPay = function () {
  return this.participations()[socratesConstants.currentYear] && !this.payment().paymentDone();
};

module.exports = Subscriber;
