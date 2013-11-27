"use strict";

require('../configureForTest');
var conf = require('nconf');
var expect = require('chai').expect;
var moment = require('moment-timezone');

var WaitinglistEntry = conf.get('beans').get('waitinglistEntry');


var entryWithoutParam = new WaitinglistEntry();
var registrationDate = moment().toDate();
var entryWithParam = new WaitinglistEntry({_registrantId: "12345", _activityName: "Meine Aktivität", _resourceName: "Meine Ressource",
  _registrationDate: registrationDate});


describe('Waitinglist Entry', function () {

  it('without argument yields undefined for each query', function () {

    expect(entryWithoutParam.registrantId()).to.be.undefined;
    expect(entryWithoutParam.activityUrl()).to.be.undefined;
    expect(entryWithoutParam.resourceName()).to.be.undefined;
    expect(entryWithoutParam.registrationDate()).to.be.undefined;
    expect(entryWithoutParam.registrationValidUntil()).to.be.undefined;
  });

  it('returns the id of the registrant', function () {
    expect(entryWithParam.registrantId()).to.equal("12345");
  });

  it('returns the activity name', function () {
    expect(entryWithParam.activityUrl()).to.equal("Meine Aktivität");
  })
  ;

  it('returns the resource name', function () {
    expect(entryWithParam.resourceName()).to.equal("Meine Ressource");
  })
  ;

  it('returns the registration date', function () {
    expect(entryWithParam.registrationDate()).to.equal(registrationDate);
  });

  it('initially has no registration validity limit', function () {
    expect(entryWithParam.registrationValidUntil()).to.be.undefined;
  });

  it('has a registration validity limit when it is set', function () {
    entryWithParam.setRegistrationValidityFor("3");
    expect(entryWithParam.registrationValidUntil()).to.not.be.undefined;
  });

  it('can remove the registration validity limit after setting it', function () {
    entryWithParam.setRegistrationValidityFor("3");
    entryWithParam.setRegistrationValidityFor();
    expect(entryWithParam.registrationValidUntil()).to.be.undefined;
  });

});