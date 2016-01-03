'use strict';

var expect = require('must-dist');

var beans = require('../../testutil/configureForTest').get('beans');
var Subscriber = beans.get('subscriber');
var currentYear = beans.get('socratesConstants').currentYear;

describe.only('Subscriber', function () {
  var unregisteredSubscriber;
  var unregisteredSubscriberWhoParticipatedLastYear;
  var registeredSubscriber;

  beforeEach(function () {
    var registered = {};
    registered[currentYear] = {};
    unregisteredSubscriber = new Subscriber({id: 'unregistered'});
    unregisteredSubscriberWhoParticipatedLastYear = new Subscriber({id: 'unregistered', participations: {'2014': {}}});
    registeredSubscriber = new Subscriber({id: 'unregistered', participations: registered});
  });

  it('isParticipating', function () {
    expect(unregisteredSubscriber.isParticipating()).to.be.false();
    expect(unregisteredSubscriberWhoParticipatedLastYear.isParticipating()).to.be.false();
    expect(registeredSubscriber.isParticipating()).to.be.true();
  });

  it('hasParticipatedAnyYear', function () {
    expect(unregisteredSubscriber.hasParticipatedAnyYear()).to.be.false();
    expect(unregisteredSubscriberWhoParticipatedLastYear.hasParticipatedAnyYear()).to.be.true();
    expect(registeredSubscriber.hasParticipatedAnyYear()).to.be.true();
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

    it('the participation if no answer for question1 is provided', function () {
      unregisteredSubscriber.fillFromUI({});
      expect(unregisteredSubscriber.state.participation).to.be.undefined();
      expect(unregisteredSubscriber.currentParticipation().question1()).to.be.undefined();
    });
  });

  describe('does fill from UI', function () {
    it('the addon if some home address provided', function () {
      unregisteredSubscriber.fillFromUI({homeAddress: 'bingo'});
      expect(unregisteredSubscriber.addon().homeAddress()).to.be('bingo');
    });

    it('the participation if an answer for question1 is provided', function () {
      unregisteredSubscriber.fillFromUI({question1: 'Q1'});
      expect(unregisteredSubscriber.currentParticipation().question1()).to.be('Q1');
    });
  });

  describe('gives participation information by year (if available)', function () {
    it('for the year 2010', function () {
      unregisteredSubscriber.fillFromUI({question1: 'Q1'});
      unregisteredSubscriber.state.participations['2010'] = unregisteredSubscriber.state.participations[currentYear];
      delete unregisteredSubscriber.state.participations[currentYear];
      expect(unregisteredSubscriber.participationOf('2010').question1()).to.be('Q1');
    });
  });
});
