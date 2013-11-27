"use strict";

require('../configureForTest');
var conf = require('nconf');
var expect = require('chai').expect;
var moment = require('moment-timezone');

var WaitinglistEntry = conf.get('beans').get('waitinglistEntry');

describe('Waitinglist Entry', function () {

  it('without argument yields undefined for each query', function () {
    var entry = new WaitinglistEntry();

    expect(entry.registrantId()).to.be.undefined;
    expect(entry.activityName()).to.be.undefined;
    expect(entry.resourceName()).to.be.undefined;
    expect(entry.registrationDate()).to.be.undefined;
    expect(entry.registrationValidUntil()).to.be.undefined;
  });

  it('returns the id of the registrant', function () {
    var entry = new WaitinglistEntry({_registrantId: "12345", _activityName: "Meine Aktivität", _resourceName: "Meine Ressource",
      _registrationDate: moment().toDate()});

    expect(entry.registrantId()).to.equal("12345");
  });

  it('returns the activity name', function () {
    var entry = new WaitinglistEntry({_registrantId: "12345", _activityName: "Meine Aktivität", _resourceName: "Meine Ressource",
      _registrationDate: moment().toDate()});

    expect(entry.activityName()).to.equal("Meine Aktivität");
  })
  ;

  it('returns the resource name', function () {
    var entry = new WaitinglistEntry({_registrantId: "12345", _activityName: "Meine Aktivität", _resourceName: "Meine Ressource",
      _registrationDate: moment().toDate()});

    expect(entry.resourceName()).to.equal("Meine Ressource");
  })
  ;

  it('returns the registration date', function () {
    var registrationDate = moment().toDate();
    var entry = new WaitinglistEntry({_registrantId: "12345", _activityName: "Meine Aktivität", _resourceName: "Meine Ressource",
      _registrationDate: registrationDate});

    expect(entry.registrationDate()).to.equal(registrationDate);
  });

  it('initially has no registration validity limit', function () {
    var entry = new WaitinglistEntry({_registrantId: "12345", _activityName: "Meine Aktivität", _resourceName: "Meine Ressource",
      _registrationDate: moment().toDate()});

    expect(entry.registrationValidUntil()).to.be.undefined;
  });

  it('has a registration validity limit when it is set', function () {
    var entry = new WaitinglistEntry({_registrantId: "12345", _activityName: "Meine Aktivität", _resourceName: "Meine Ressource",
      _registrationDate: moment().toDate()});

    entry.setRegistrationValidityFor("3");
    expect(entry.registrationValidUntil()).to.not.be.undefined;
  });

  it('can remove the registration validity limit after setting it', function () {
    var entry = new WaitinglistEntry({_registrantId: "12345", _activityName: "Meine Aktivität", _resourceName: "Meine Ressource",
      _registrationDate: moment().toDate()});

    entry.setRegistrationValidityFor("3");
    entry.setRegistrationValidityFor();
    expect(entry.registrationValidUntil()).to.be.undefined;
  });

});