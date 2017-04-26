'use strict';

const beans = require('simple-configure').get('beans');
const Addon = beans.get('socratesAddon');
const Participation = beans.get('socratesParticipation');
const socratesConstants = beans.get('socratesConstants');

class Subscriber {
  constructor(object) {
    this.state = object || {};
  }

  fillFromUI(uiInputObject) {
    this.state.notifyOnWikiChangesSoCraTes = !!uiInputObject.notifyOnWikiChangesSoCraTes;
    this.state.country = uiInputObject.country;

    if (Addon.hasAddonInformation(uiInputObject)) {
      this.addon().fillFromUI(uiInputObject);
    }
    if (Participation.hasParticipationInformation(uiInputObject)) {
      this.currentParticipation().fillFromUI(uiInputObject);
    }
    return this;
  }

  id() {
    return this.state.id;
  }

  notifyOnWikiChangesSoCraTes() {
    return this.state.notifyOnWikiChangesSoCraTes;
  }

  country() {
    return this.state.country;
  }

  livesInGermany() {
    return this.country() === 'DE';
  }

  isDiversity() {
    return this.addon().ladiesTShirt() || !this.livesInGermany();
  }

  diversityAdmissionStatus() {
    return this.isDiversity() ? 'yes' : this.addon().hasCustomPronoun() ? 'check' : '';
  }

  addon() {
    /*eslint no-underscore-dangle: 0*/
    if (!this.state._addon) {
      this.state._addon = {};
    }
    return new Addon(this.state._addon);
  }

  participations() {
    if (!this.state.participations) {
      this.state.participations = {};
    }
    return this.state.participations;
  }

  currentParticipation() {
    return this.participationOf(socratesConstants.currentYear);
  }

  participationOf(year) {
    if (!this.participations()[year]) {
      this.state.participations[year] = {};
    }
    return new Participation(this.participations()[year]);
  }

  isParticipating() {
    return !!this.participations()[socratesConstants.currentYear];
  }
}

module.exports = Subscriber;
