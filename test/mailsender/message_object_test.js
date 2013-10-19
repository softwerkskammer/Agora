"use strict";

require('../configureForTest');

var beans = require('nconf').get('beans');
var expect = require('chai').expect;
var Message = beans.get('message');

describe('Message Object\'s bcc', function () {
  it('is not filled by empty groups', function (done) {
    var message = new Message();
    var groups = [];
    message.setBccToGroupMemberAddresses(groups);
    expect(message.bcc).to.be.empty;
    done();
  });

  it('is not filled by groups with no members', function (done) {
    var message = new Message();
    var groups = [
      {members: []},
      {members: []},
      {members: []}
    ];
    message.setBccToGroupMemberAddresses(groups);
    expect(message.bcc).to.be.empty;
    done();
  });

  it('is filled by groups with members', function (done) {
    var message = new Message();
    var groups = [
      {members: [
        {email: 'heinz'}
      ]},
      {members: [
        {email: 'hans'}
      ]},
      {members: [
        {email: 'elfriede'}
      ]}
    ];
    message.setBccToGroupMemberAddresses(groups);
    expect(message.bcc).to.deep.equal(['heinz', 'hans', 'elfriede']);
    done();
  });

  it('is filled by groups with members and removing duplicates', function (done) {
    var message = new Message();
    var groups = [
      {members: [
        {email: 'heinz'}
      ]},
      {members: [
        {email: 'heinz'}
      ]},
      {members: [
        {email: 'hans'}
      ]},
      {members: [
        {email: 'elfriede'}
      ]}
    ];
    message.setBccToGroupMemberAddresses(groups);
    expect(message.bcc).to.deep.equal(['heinz', 'hans', 'elfriede']);
    done();
  });

  it('is not filled by empty members', function (done) {
    var message = new Message();
    var members = [];
    message.setBccToMemberAddresses(members);
    expect(message.bcc).to.be.empty;
    done();
  });

  it('is filled by members', function (done) {
    var message = new Message();
    var members = [
      {email: 'heinz'},
      {email: 'hans'},
      {email: 'elfriede'}
    ];
    message.setBccToMemberAddresses(members);
    expect(message.bcc).to.deep.equal(['heinz', 'hans', 'elfriede']);
    done();
  });
});

describe('Message Object to TransportObject', function () {
  
  it('converts the sender address to use the provided technical email address', function (done) {
    var member = {displayName: function () { return 'Hans Dampf'; }, email: 'E-Mail'};
    var message = new Message({}, member);
    var transportObject = message.toTransportObject('dummy');
    expect(transportObject.from).to.equal('"Hans Dampf via softwerkskammer.org" <dummy>');
    done();
  });
  
  it('converts the sender address to use it as replyTo', function (done) {
    var member = {displayName: function () { return 'Hans Dampf'; }, email: 'E-Mail'};
    var message = new Message({}, member);
    var transportObject = message.toTransportObject('dummy');
    expect(transportObject.replyTo).to.equal('"Hans Dampf" <E-Mail>');
    done();
  });
  
});

