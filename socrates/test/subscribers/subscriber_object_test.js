'use strict';

var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must');

var beans = require('../../testutil/configureForTest').get('beans');
var userWithoutMember = require('../../testutil/userWithoutMember');
var membersService = beans.get('membersService');
var memberstore = beans.get('memberstore');
var activitystore = beans.get('activitystore');
var subscriberstore = beans.get('subscriberstore');
var socratesNotifications = beans.get('socratesNotifications');
var groupsAndMembersService = beans.get('groupsAndMembersService');
var Member = beans.get('member');
var Subscriber = beans.get('subscriber');
var SoCraTesActivity = beans.get('socratesActivityExtended');
var currentYear = beans.get('socratesConstants').currentYear;

var createApp = require('../../testutil/testHelper')('socratesMembersApp').createApp;

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
});