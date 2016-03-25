'use strict';

var expect = require('must-dist');

var beans = require('../../testutil/configureForTest').get('beans');
var Subscriber = beans.get('subscriber');
var currentYear = beans.get('socratesConstants').currentYear;

describe('Subscriber', function () {
  var unregisteredSubscriber;
  var unregisteredSubscriberWhoParticipatedLastYear;
  var registeredSubscriber;

  beforeEach(function () {
    var registered = {};
    registered[currentYear] = {};
    unregisteredSubscriber = new Subscriber({id: 'unregistered'});
    unregisteredSubscriberWhoParticipatedLastYear = new Subscriber({id: 'unregistered', participations: {}});
    registeredSubscriber = new Subscriber({id: 'unregistered', participations: registered});
  });

  it('isParticipating', function () {
    expect(unregisteredSubscriber.isParticipating()).to.be.false();
    expect(unregisteredSubscriberWhoParticipatedLastYear.isParticipating()).to.be.false();
    expect(registeredSubscriber.isParticipating()).to.be.true();
  });

  describe('does NOT fill from UI', function () {
    it('the subscriber id', function () {
      unregisteredSubscriber.fillFromUI({id: 'ID'});
      expect(unregisteredSubscriber.id()).to.be('unregistered');
    });

    it('the addon if no home address provided', function () {
      /* eslint no-underscore-dangle: 0 */

      unregisteredSubscriber.fillFromUI({});
      expect(unregisteredSubscriber.state._addon).to.be.undefined();
      expect(unregisteredSubscriber.addon().homeAddress()).to.be.undefined();
    });

    it('the participation if no participation information hint is given', function () {
      unregisteredSubscriber.fillFromUI({roommate: 'My best friend'});
      expect(unregisteredSubscriber.state.participation).to.be.undefined();
      expect(unregisteredSubscriber.currentParticipation().roommate()).to.be.undefined();
    });
  });

  describe('does fill from UI', function () {
    it('the addon if some home address provided', function () {
      unregisteredSubscriber.fillFromUI({homeAddress: 'bingo'});
      expect(unregisteredSubscriber.addon().homeAddress()).to.be('bingo');
    });

    it('the participation if a participation information hint is provided', function () {
      unregisteredSubscriber.fillFromUI({hasParticipationInformation: true});
      expect(unregisteredSubscriber.currentParticipation().roommate()).to.be(undefined);
    });
  });

  describe('gives participation information by year (if available)', function () {
    it('for the year 2010', function () {
      unregisteredSubscriber.fillFromUI({hasParticipationInformation: true, roommate: 'My sister'});
      unregisteredSubscriber.state.participations['2010'] = unregisteredSubscriber.state.participations[currentYear];
      delete unregisteredSubscriber.state.participations[currentYear];
      expect(unregisteredSubscriber.participationOf('2010').roommate()).to.be('My sister');
    });
  });
});
