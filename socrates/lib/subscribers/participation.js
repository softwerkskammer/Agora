'use strict';

const beans = require('simple-configure').get('beans');
const Renderer = beans.get('renderer');

class Participation {
  constructor(object) {
    this.state = object || {};
  }

  fillFromUI(uiInputObject) {
    this.state.roommate = uiInputObject.roommate || '';
    return this;
  }

  roommate() {
    return this.state.roommate;
  }

  // these should remain here so that the data from previous years can still be accessed
  question1() {
    return this.state.question1;
  }

  question2() {
    return this.state.question2;
  }

  question3() {
    return this.state.question3;
  }

  question1Html() {
    return Renderer.render(this.state.question1);
  }

  question2Html() {
    return Renderer.render(this.state.question2);
  }

  question3Html() {
    return Renderer.render(this.state.question3);
  }

  static hasParticipationInformation(uiInputObject) {
    return !!uiInputObject.hasParticipationInformation;
  }
}

module.exports = Participation;
