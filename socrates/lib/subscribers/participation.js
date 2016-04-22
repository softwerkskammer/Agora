'use strict';

var beans = require('simple-configure').get('beans');
var Renderer = beans.get('renderer');

function Participation(object) {
  this.state = object || {};
}

Participation.prototype.fillFromUI = function (uiInputObject) {
  this.state.roommate = uiInputObject.roommate || '';
  return this;
};

Participation.prototype.roommate = function () {
  return this.state.roommate;
};

// these should remain here so that the data from previous years can still be accessed
Participation.prototype.question1 = function () {
  return this.state.question1;
};

Participation.prototype.question2 = function () {
  return this.state.question2;
};

Participation.prototype.question3 = function () {
  return this.state.question3;
};

Participation.prototype.question1Html = function () {
  return Renderer.render(this.state.question1);
};

Participation.prototype.question2Html = function () {
  return Renderer.render(this.state.question2);
};

Participation.prototype.question3Html = function () {
  return Renderer.render(this.state.question3);
};

Participation.hasParticipationInformation = function (uiInputObject) {
  return !!uiInputObject.hasParticipationInformation;
};

module.exports = Participation;
