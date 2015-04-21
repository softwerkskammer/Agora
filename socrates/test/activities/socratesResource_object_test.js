'use strict';

var moment = require('moment-timezone');
var expect = require('must');
var _ = require('lodash');

var beans = require('../../testutil/configureForTest').get('beans');
var Resource = beans.get('resource');
var SoCraTesResource = beans.get('socratesResource');

var tomorrow = moment();
tomorrow.add(1, 'days');

describe('SoCraTesResource', function () {
  it('can tell its name', function () {
    var resource = new Resource({
      _registrationOpen: true,
      _registeredMembers: []
    }, 'name');
    var socratesResource = new SoCraTesResource(resource);
    expect(socratesResource.resourceName).to.be('name');
  });

  it('adds the expiration time to a registered member', function () {
    var resource = new Resource({
      _registrationOpen: true,
      _registeredMembers: []
    });
    var socratesResource = new SoCraTesResource(resource);

    socratesResource.reserve({sessionID: 'sessionID', duration: 3});

    var expirationTime = socratesResource.state._registeredMembers[0].expiresAt;
    expect(expirationTime).to.exist();
    expect(moment(expirationTime).isBetween(moment().add(29, 'minutes'), moment().add(31, 'minutes'))).to.be(true);
  });

  it('can tell if a reservation is valid', function () {
    var resource = new Resource({
      _registrationOpen: true,
      _registeredMembers: []
    });
    var socratesResource = new SoCraTesResource(resource);

    var registrationTuple = {sessionID: 'sessionID', duration: 3};
    socratesResource.reserve(registrationTuple);

    expect(socratesResource.hasValidReservationFor(registrationTuple)).to.be.true();
  });

  it('handles empty participants gracefully when checking reservation validity', function () {
    var resource = new Resource({
      _registrationOpen: true,
      _registeredMembers: []
    });
    var socratesResource = new SoCraTesResource(resource);

    var registrationTuple = {sessionID: 'sessionID', duration: 3};

    expect(socratesResource.hasValidReservationFor(registrationTuple)).to.be.false();
  });

  it('registers a member and deletes the session', function () {
    var resource = new Resource({
      _registrationOpen: true,
      _registeredMembers: []
    });
    var socratesResource = new SoCraTesResource(resource);

    var registrationTuple = {sessionID: 'sessionID', duration: 3};
    socratesResource.reserve(registrationTuple);

    socratesResource.register('memberID', registrationTuple);

    expect(socratesResource.state._registeredMembers[0].memberId).to.be('memberID');
  });

  it('prefixes the saved memberID with "SessionID:"', function () {
    var resource = new Resource({
      _registrationOpen: true,
      _registeredMembers: []
    });
    var socratesResource = new SoCraTesResource(resource);

    socratesResource.reserve({sessionID: 'sessionID', duration: 3});

    expect(socratesResource.state._registeredMembers[0].memberId).to.be('SessionID:sessionID');
  });

  describe('clean up during creation (in constructor)', function () {
    it('only expired reservations', function () {
      var resource = new Resource({
        _registeredMembers: [
          {memberId: 'memberID', expiresAt: moment().subtract(1, 'minutes').toDate()},
          {memberId: 'memberID2', expiresAt: moment().add(1, 'minutes').toDate()}
        ]
      });
      var socratesResource = new SoCraTesResource(resource);

      expect(socratesResource.registeredMembers()).to.not.contain('memberID');
      expect(socratesResource.registeredMembers()).to.contain('memberID2');
    });

    it('nothing if expiresAt is not set', function () {
      var resource = new Resource({
        _registeredMembers: [
          {memberId: 'memberID'}
        ]
      });
      var socratesResource = new SoCraTesResource(resource);

      expect(socratesResource.registeredMembers()).is.not.empty();
      expect(socratesResource.registeredMembers()).to.contain('memberID');
    });

    it('does work error-free with empty resources', function () {
      var resource = new Resource({
        _registeredMembers: []
      });
      var socratesResource = new SoCraTesResource(resource);

      expect(socratesResource.registeredMembers()).is.empty();
    });
  });
});
