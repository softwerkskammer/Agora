'use strict';

var beans = require('simple-configure').get('beans');
var Payment = beans.get('socratesPayment');

function Participation(object) {
  this.state = object || {};
}

Participation.prototype.fillFromUI = function (uiInputObject) {
  this.state.roommate = uiInputObject.roommate;
  this.state.question1 = uiInputObject.question1;
  this.state.question2 = uiInputObject.question2;
  this.state.question3 = uiInputObject.question3;
  return this;
};

Participation.prototype.payment = function () {
  if (!this.state.payment) {
    this.state.payment = {};
  }
  return new Payment(this.state.payment);
};

Participation.prototype.roommate = function () {
  return this.state.roommate;
};

Participation.prototype.question1 = function () {
  return this.state.question1;
};

Participation.prototype.question2 = function () {
  return this.state.question2;
};

Participation.prototype.question3 = function () {
  return this.state.question3;
};

Participation.hasParticipationInformation = function (uiInputObject) {
  return !!uiInputObject.question1;
};

module.exports = Participation;
