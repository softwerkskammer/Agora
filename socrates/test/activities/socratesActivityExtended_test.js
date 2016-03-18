'use strict';

var moment = require('moment-timezone');
var expect = require('must-dist');

var beans = require('../../testutil/configureForTest').get('beans');
var SoCraTesActivity = beans.get('socratesActivityExtended');

var tomorrow = moment();
tomorrow.add(1, 'days');

describe('Extended SoCraTes Activity', function () {

  it('registers a registrationTuple', function () {
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

  it('returns a registered member\'s optionText', function () {
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
    activity.register('heinz', registrationTuple);

    expect(activity.selectedOptionFor('heinz')).to.be('single,3');
  });

  it('returns a registered member\'s optionText for waitinglist registration', function () {
    var activity = new SoCraTesActivity({
      resources: {
        single: {
          _registrationOpen: false,
          _registeredMembers: [],
          _waitinglist: []
        }
      }
    });
    var registrationTuple = {resourceName: 'single', sessionID: 'sessionID', duration: 'waitinglist'};
    activity.reserve(registrationTuple);
    activity.register('heinz', registrationTuple);

    expect(activity.selectedOptionFor('heinz')).to.be('single,waitinglist');
  });

  it('returns null as the optionText for a not registered member', function () {
    var activity = new SoCraTesActivity({
      resources: {
        single: {
          _registrationOpen: true,
          _registeredMembers: []
        }
      }
    });

    expect(activity.selectedOptionFor('heinz')).to.be(null);
  });

});
