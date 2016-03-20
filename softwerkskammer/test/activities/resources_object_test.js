'use strict';

require('../../testutil/configureForTest');
var expect = require('must-dist');
var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');

var Resources = beans.get('resources');

describe('Resources (fillFromUI)', function () {
  describe('adding / removing children', function () {

    it('does nothing if the name is not changed', function () {
      var resources = new Resources({ name1: {_registeredMembers: [
        {memberId: 'memberId'}
      ]}});

      resources.fillFromUI({names: 'name1', limits: '', previousNames: 'name1'});

      expect(resources.resourceNames().length).to.equal(1);
      expect(resources.resourceNames()).to.contain('name1');
      expect(resources.named('name1').registeredMembers().length).to.equal(1);
      expect(resources.named('name1').registeredMembers()).to.contain('memberId');
    });

    it('renames the key if the name is changed', function () {
      var resources = new Resources({ name1: {_registeredMembers: [
        {memberId: 'memberId'}
      ]}});

      resources.fillFromUI({names: 'name2', limits: '', previousNames: 'name1'});

      expect(resources.resourceNames().length).to.equal(1);
      expect(resources.resourceNames()).to.not.contain('name1');
      expect(resources.resourceNames()).to.contain('name2');
      expect(resources.named('name2').registeredMembers().length).to.equal(1);
      expect(resources.named('name2').registeredMembers()).to.contain('memberId');
    });

    it('removes the key if the new name is empty', function () {
      var resources = new Resources({ name1: {}});

      resources.fillFromUI({names: '', limits: '', previousNames: 'name1'});

      expect(resources.resourceNames().length).to.equal(0);
    });

    it('creates the key if the previous name is empty', function () {
      var resources = new Resources({});

      resources.fillFromUI({names: 'name1', limits: '', previousNames: ''});

      expect(resources.resourceNames().length).to.equal(1);
      expect(resources.resourceNames()).to.contain('name1');
      expect(resources.named('name1').registeredMembers().length).to.equal(0);
    });

    it('exchanges two resources if their names are switched', function () {
      var resources = new Resources({ name1: {_registeredMembers: [
        {memberId: 'memberId1'}
      ]},
        name2: {_registeredMembers: [
          {memberId: 'memberId2'}
        ]}});

      resources.fillFromUI({names: ['name2', 'name1'], limits: ['', ''], previousNames: ['name1', 'name2']});

      expect(resources.resourceNames().length).to.equal(2);
      expect(resources.resourceNames()).to.contain('name1');
      expect(resources.resourceNames()).to.contain('name2');
      expect(resources.named('name1').registeredMembers().length).to.equal(1);
      expect(resources.named('name1').registeredMembers()).to.contain('memberId2');
      expect(resources.named('name2').registeredMembers().length).to.equal(1);
      expect(resources.named('name2').registeredMembers()).to.contain('memberId1');
    });
  });

  describe('integration test', function () {

    it('adheres to values in constructor', function () {
      var resources = new Resources({ name1: {_limit: 20, _registrationOpen: true, _waitinglist: []}});

      expect(resources.named('name1').limit()).to.equal(20);
      expect(resources.named('name1').isRegistrationOpen()).to.be(true);
      expect(resources.named('name1').hasWaitinglist()).to.be(true);
    });

    it('adds values if given', function () {
      var resources = new Resources({ name1: {}});

      resources.fillFromUI({names: 'name1', previousNames: 'name1', limits: '10', isRegistrationOpen: 'yes', hasWaitinglist: 'yes'});

      expect(resources.named('name1').limit()).to.equal(10);
      expect(resources.named('name1').isRegistrationOpen()).to.be(true);
      expect(resources.named('name1').hasWaitinglist()).to.be(true);
    });

    it('removes value if not given', function () {
      var resources = new Resources({ name1: {_limit: 20, _registrationOpen: true, _withWaitinglist: true}});

      resources.fillFromUI({names: 'name1', limits: '', previousNames: 'name1'});

      expect(resources.named('name1').limit()).to.be(undefined);
      expect(resources.named('name1').isRegistrationOpen()).to.be(false);
      expect(resources.named('name1').hasWaitinglist()).to.be(false);
    });
  });

  describe('- registration dates -', function () {
    var resources;
    beforeEach(function () {
      resources = new Resources({resource1: { _registrationOpen: true }, resource2: { _registrationOpen: true }});
    });

    it('returns an empty array if the member is not registered', function () {
      expect(resources.registrationDatesOf('12345').length).to.equal(0);
    });

    it('returns the registration date if the member is registered in one resource', function () {
      var momentOfRegistration = moment('2014-03-03');
      resources.named('resource1').addMemberId('12345', momentOfRegistration);

      expect(resources.registrationDatesOf('12345').length).to.equal(1);
      expect(resources.registrationDatesOf('12345')[0].format()).to.equal(momentOfRegistration.format());
    });

    it('returns the registration date if the member is registered in one resource but not in another one', function () {
      var momentOfRegistration = moment('2014-03-03');
      var momentOfRegistration2 = moment('2014-03-04');
      resources.named('resource1').addMemberId('12345', momentOfRegistration);
      resources.named('resource2').addMemberId('otherMember', momentOfRegistration2);

      expect(resources.registrationDatesOf('12345').length).to.equal(1);
      expect(resources.registrationDatesOf('12345')[0].format()).to.equal(momentOfRegistration.format());
    });

    it('returns the registration dates if the member is registered in several resources (even if it is the same day)', function () {
      var momentOfRegistration = moment('2014-03-03');
      var momentOfRegistration2 = moment('2014-03-03');
      resources.named('resource1').addMemberId('12345', momentOfRegistration);
      resources.named('resource2').addMemberId('12345', momentOfRegistration2);

      expect(resources.registrationDatesOf('12345').length).to.equal(2);
      expect(resources.registrationDatesOf('12345')[0].format()).to.equal(momentOfRegistration.format());
      expect(resources.registrationDatesOf('12345')[1].format()).to.equal(momentOfRegistration2.format());
    });

    it('sorts the registration dates (direction 1)', function () {
      var momentOfRegistration = moment('2014-03-03');
      var momentOfRegistration2 = moment('2014-03-04');
      resources.named('resource1').addMemberId('12345', momentOfRegistration); // the earlier date comes first
      resources.named('resource2').addMemberId('12345', momentOfRegistration2);

      expect(resources.registrationDatesOf('12345').length).to.equal(2);
      expect(resources.registrationDatesOf('12345')[0].format()).to.equal(momentOfRegistration.format());
      expect(resources.registrationDatesOf('12345')[1].format()).to.equal(momentOfRegistration2.format());
    });

    it('sorts the registration dates (direction 2)', function () {
      var momentOfRegistration = moment('2014-03-03');
      var momentOfRegistration2 = moment('2014-03-04');
      resources.named('resource1').addMemberId('12345', momentOfRegistration2); // the later date comes first
      resources.named('resource2').addMemberId('12345', momentOfRegistration);

      expect(resources.registrationDatesOf('12345').length).to.equal(2);
      expect(resources.registrationDatesOf('12345')[0].format()).to.equal(momentOfRegistration.format());
      expect(resources.registrationDatesOf('12345')[1].format()).to.equal(momentOfRegistration2.format());
    });

  });

  describe('- resource names -', function () {
    var resources;
    beforeEach(function () {
      resources = new Resources({resource1: { _registrationOpen: true }, resource2: { _registrationOpen: true }});
    });

    it('returns an empty array if the member is not registered', function () {
      expect(resources.resourceNamesOf('12345').length).to.equal(0);
    });

    it('returns the resource name if the member is registered in one resource', function () {
      var momentOfRegistration = moment('2014-03-03');
      resources.named('resource1').addMemberId('12345', momentOfRegistration);

      expect(resources.resourceNamesOf('12345').length).to.equal(1);
      expect(resources.resourceNamesOf('12345')[0]).to.equal('resource1');
    });

    it('returns the resource names if the member is registered in several resources', function () {
      var momentOfRegistration = moment('2014-03-03');
      var momentOfRegistration2 = moment('2014-03-03');
      resources.named('resource1').addMemberId('12345', momentOfRegistration);
      resources.named('resource2').addMemberId('12345', momentOfRegistration2);

      expect(resources.resourceNamesOf('12345').length).to.equal(2);
      expect(resources.resourceNamesOf('12345')[0]).to.equal('resource1');
      expect(resources.resourceNamesOf('12345')[1]).to.equal('resource2');
    });

  });


});
