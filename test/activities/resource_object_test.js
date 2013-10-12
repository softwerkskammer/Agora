"use strict";

require('../configureForTest');
var conf = require('nconf');
var expect = require('chai').expect;

var Resource = conf.get('beans').get('resource');


describe('Resource stores a list of members', function () {
  it('can add a member', function (done) {
    var resource = new Resource();
    resource.addMemberId('memberID');
    expect(resource.registeredMembers()).to.contain('memberID');
    done();
  });

  it('does not add a member twice', function (done) {
    var resource = new Resource(['memberID']);
    resource.addMemberId('memberID');
    expect(resource.registeredMembers().length).to.equal(1);
    done();
  });

  it('can remove a registered member', function (done) {
    var resource = new Resource(['memberID']);
    resource.removeMemberId('memberID');
    expect(resource.registeredMembers()).to.be.empty;
    done();
  });

  it('does nothing when removing a non registered member', function (done) {
    var resource = new Resource(['memberID']);
    resource.removeMemberId('notRegisteredID');
    expect(resource.registeredMembers().length).to.equal(1);
    expect(resource.registeredMembers()).to.contain('memberID');
    done();
  });

  it('can remove member even when empty', function (done) {
    var resource = new Resource();
    resource.removeMemberId('notRegisteredID');
    expect(resource.registeredMembers()).to.be.empty;
    done();
  });

});
