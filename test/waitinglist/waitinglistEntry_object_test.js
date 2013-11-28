"use strict";

require('../configureForTest');
var beans = require('nconf').get('beans');
var expect = require('chai').expect;

var WaitinglistEntry = beans.get('waitinglistEntry');
var fieldHelpers = beans.get('fieldHelpers');


var entryWithoutParam = new WaitinglistEntry();
var registrationDate = fieldHelpers.parseToMomentUsingDefaultTimezone("23.02.2013", "17:44").toDate();
var entryWithParam = new WaitinglistEntry({_registrantId: "12345", _activityId: "Meine Aktivität", _resourceName: "Meine Ressource",
  _registrationDate: registrationDate});


describe('Waitinglist Entry', function () {

  it('without argument yields undefined for each query', function () {

    expect(entryWithoutParam.registrantId()).to.be.undefined;
    expect(entryWithoutParam.activityId()).to.be.undefined;
    expect(entryWithoutParam.resourceName()).to.be.undefined;
    expect(entryWithoutParam.registrationDate()).to.be.undefined;
    expect(entryWithoutParam.registrationValidUntil()).to.be.undefined;
  });

  it('returns the id of the registrant', function () {
    expect(entryWithParam.registrantId()).to.equal("12345");
  });

  it('returns the activity name', function () {
    expect(entryWithParam.activityId()).to.equal("Meine Aktivität");
  })
  ;

  it('returns the resource name', function () {
    expect(entryWithParam.resourceName()).to.equal("Meine Ressource");
  })
  ;

  it('returns the registration date', function () {
    expect(entryWithParam.registrationDate()).to.equal("23.02.2013 17:44");
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