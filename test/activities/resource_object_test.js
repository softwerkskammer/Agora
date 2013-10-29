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

  it('does not add a member twice', function (done) {
    var resource = new Resource({_registeredMembers: ['memberID']});
    resource.addMemberId('memberID');
    expect(resource.registeredMembers().length).to.equal(1);
    done();
  });

  it('can remove a registered member', function (done) {
    var resource = new Resource({_registeredMembers: ['memberID']});
    resource.removeMemberId('memberID');
    expect(resource.registeredMembers()).to.be.empty;
    done();
  });

  it('does nothing when removing a non registered member', function (done) {
    var resource = new Resource({_registeredMembers: ['memberID']});
    resource.removeMemberId('notRegisteredID');
    expect(resource.registeredMembers().length).to.equal(1);
    expect(resource.registeredMembers()).to.contain('memberID');
    done();
  });

  it('can remove member even when empty', function (done) {
    var resource = new Resource({_registeredMembers: []});
    resource.removeMemberId('notRegisteredID');
    expect(resource.registeredMembers()).to.be.empty;
    done();
  });

  it('tells that an empty resource is not full', function (done) {
    var resource = new Resource({_registeredMembers: []});
    expect(resource.isFull()).to.be.false;
    done();
  });

  it('tells that a resource with one spot is full when one member is registered', function (done) {
    var resource = new Resource({_registeredMembers: ['memberID'], _limit: 1});
    expect(resource.isFull()).to.be.true;
    done();
  });

  it('tells that a resource with one spot does not accept member registrations when one member is registered', function (done) {
    var resource = new Resource({_registeredMembers: ['memberID'], _limit: 1});
    resource.addMemberId('otherMemberID');
    expect(resource.registeredMembers().length).to.equal(1);
    expect(resource.registeredMembers()).to.contain('memberID');
    done();
  });

});
