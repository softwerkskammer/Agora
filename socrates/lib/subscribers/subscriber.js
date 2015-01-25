'use strict';

var beans = require('simple-configure').get('beans');
var Addon = beans.get('socratesAddon');
var Payment = beans.get('socratesPayment');

function Subscriber(object) {
  this.state = object || {};
}

// Addon information as most recently entered by the subscriber:
Subscriber.prototype.addon = function () {
  if (!this.state._addon) {
    this.state._addon = {};
  }
  return new Addon(this.state._addon);
};

Subscriber.prototype.payment = function () {
  if (!this.state._payment) {
    this.state._payment = {};
  }
  return new Payment(this.state._payment);
};

module.exports = Subscriber;