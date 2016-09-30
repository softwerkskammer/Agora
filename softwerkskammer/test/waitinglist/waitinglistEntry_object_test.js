'use strict';

require('../../testutil/configureForTest');
var beans = require('simple-configure').get('beans');
var expect = require('must-dist');

var WaitinglistEntry = beans.get('waitinglistEntry');
var moment = require('moment-timezone');


var entryWithoutParam = new WaitinglistEntry();
var registrationDate = moment('23.02.2013 17:44', 'DD.MM.YYYY HH:mm').toDate();
var entryWithParam = new WaitinglistEntry({_memberId: '12345', _registeredAt: registrationDate}, 'Meine Ressource');


describe('Waitinglist Entry', function () {

  it('without argument yields undefined for each query', function () {

    expect(entryWithoutParam.registrantId()).to.be(undefined);
    expect(entryWithoutParam.resourceName()).to.be('Veranstaltung');
    expect(entryWithoutParam.registrationDate()).to.be(undefined);
    expect(entryWithoutParam.registrationValidUntil()).to.be(undefined);
  });

  it('returns the id of the registrant', function () {
    expect(entryWithParam.registrantId()).to.equal('12345');
  });

  it('returns the resource name', function () {
    expect(entryWithParam.resourceName()).to.equal('Veranstaltung');
  });

  it('returns the registration date', function () {
    expect(entryWithParam.registrationDate()).to.equal('23.02.2013 17:44');
  });

  it('initially has no registration validity limit', function () {
    expect(entryWithParam.registrationValidUntil()).to.be(undefined);
  });

  it('has a registration validity limit when it is set', function () {
    entryWithParam.setRegistrationValidityFor('3');
    expect(entryWithParam.registrationValidUntil()).to.not.be(undefined);
  });

  it('can remove the registration validity limit after setting it', function () {
    entryWithParam.setRegistrationValidityFor('3');
    entryWithParam.setRegistrationValidityFor();
    expect(entryWithParam.registrationValidUntil()).to.be(undefined);
  });

});
