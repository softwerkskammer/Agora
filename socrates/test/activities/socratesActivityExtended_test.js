'use strict';

var moment = require('moment-timezone');
var expect = require('must');
var _ = require('lodash');

var beans = require('../../testutil/configureForTest').get('beans');
var SoCraTesActivity = beans.get('socratesActivityExtended');
var Resource = beans.get('resource');

var tomorrow = moment();
tomorrow.add(1, 'days');

describe('Extended SoCraTes Activity', function () {
  it('reserves a registrationTuple', function () {
    var activity = new SoCraTesActivity({
      resources: {
        single: {
          _registrationOpen: true,
          _registeredMembers: []
        }
      }
    });
    activity.reserve({resourceName: 'single', sessionID: 'sessionID', duration: 3});

    var expirationTime = activity.socratesResourceNamed('single').state._registeredMembers[0].expiresAt;
    expect(expirationTime).to.exist();
    expect(moment(expirationTime).isBetween(moment().add(29, 'minutes'), moment().add(31, 'minutes'))).to.be(true);
  });

  it('registeres a registrationTuple', function () {
    var activity = new SoCraTesActivity({
      resources: {
        single: {
          _registrationOpen: true,
          _registeredMembers: []
        }
      }
    });
    activity.reserve({resourceName: 'single', sessionID: 'sessionID', duration: 3});

    activity.register('heinz', {resourceName: 'single', sessionID: 'sessionID', duration: 3});

    expect(activity.resourceNamed('single').isAlreadyRegistered('heinz')).to.be.true();
  });

  it('can tell if a reservation is valid', function () {
    var activity = new SoCraTesActivity({
      resources: {
        single: {
          _registrationOpen: true,
          _registeredMembers: []
        }
      }
    });
    var registrationTuple = {resourceName: 'single', sessionID: 'sessionID', duration: 3};
    activity.reserve(registrationTuple);

    expect(activity.hasValidReservationFor(registrationTuple)).to.be.true();
  });

});
