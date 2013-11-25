"use strict";

require('../configureForTest');
var conf = require('nconf');
var expect = require('chai').expect;

var Resource = conf.get('beans').get('resource');

describe('Resource', function () {
  it('can add a member', function (done) {
    var resource = new Resource({_registeredMembers: []});
    resource.addMemberId('memberID');
    expect(resource.registeredMembers()).to.contain('memberID');
    done();
  });

  it('disables registration once full', function (done) {
    var resource = new Resource({
      _registeredMembers: [
        {memberId: 'memberID'}
      ],
      _limit: 2,
      _registrationOpen: true
    });
    expect(resource.registrationOpen()).to.be.true;
    resource.addMemberId('memberID1');
    expect(resource.registeredMembers().length).to.equal(2);
    expect(resource.registrationOpen()).to.be.false;
    done();
  });

  it('does not add a member twice', function (done) {
    var resource = new Resource({_registeredMembers: [
      {memberId: 'memberID'}
    ]});
    resource.addMemberId('memberID');
    expect(resource.registeredMembers().length).to.equal(1);
    done();
  });

  it('can remove a registered member', function (done) {
    var resource = new Resource({_registeredMembers: [
      {memberId: 'memberID'}
    ]});
    resource.removeMemberId('memberID');
    expect(resource.registeredMembers()).to.be.empty;
    done();
  });

  it('does not change the registration state when removing a member', function (done) {
    var resource = new Resource({_registeredMembers: [
      {memberId: 'memberID'}
    ],
      _limit: 1,
      _registrationOpen: false
    });
    resource.removeMemberId('memberID');
    expect(resource.isFull()).to.be.false;
    expect(resource.registrationOpen()).to.be.false;
    done();
  });

  it('can remove member even when empty', function (done) {
    var resource = new Resource({_registeredMembers: []});
    resource.removeMemberId('notRegisteredID');
    expect(resource.registeredMembers()).to.be.empty;
    done();
  });

  it('is not full when it does not contain any members', function (done) {
    var resource = new Resource({_registeredMembers: []});
    expect(resource.isFull()).to.be.false;
    done();
  });

  it('with one spot is full when one member is registered', function (done) {
    var resource = new Resource({_registeredMembers: [
      {memberId: 'memberID'}
    ], _limit: 1});
    expect(resource.isFull()).to.be.true;
    done();
  });

  it('with one spot does not accept member registrations when one member is registered', function (done) {
    var resource = new Resource({_registeredMembers: [
      {memberId: 'memberID'}
    ], _limit: 1});
    resource.addMemberId('otherMemberID');
    expect(resource.registeredMembers().length).to.equal(1);
    expect(resource.registeredMembers()).to.contain('memberID');
    done();
  });

});
