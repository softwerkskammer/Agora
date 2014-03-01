"use strict";

require('../configureForTest');

var beans = require('nconf').get('beans');
var expect = require('chai').expect;
var Message = beans.get('message');
var Member = beans.get('member');

describe('Message Object\'s bcc', function () {
  it('is not filled by empty groups', function () {
    var message = new Message();
    var groups = [];
    message.setBccToGroupMemberAddresses(groups);
    expect(message.bcc).to.be.empty;
  });

  it('is not filled by groups with no members', function () {
    var message = new Message();
    var groups = [
      {members: []},
      {members: []},
      {members: []}
    ];
    message.setBccToGroupMemberAddresses(groups);
    expect(message.bcc).to.be.empty;
  });

  it('is filled by groups with members', function () {
    var message = new Message();
    var groups = [
      {members: [
        new Member({email: 'heinz'})
      ]},
      {members: [
        new Member({email: 'hans'})
      ]},
      {members: [
        new Member({email: 'elfriede'})
      ]}
    ];
    message.setBccToGroupMemberAddresses(groups);
    expect(message.bcc).to.deep.equal(['heinz', 'hans', 'elfriede']);
  });

  it('is filled by groups with members and removing duplicates', function () {
    var message = new Message();
    var groups = [
      {members: [
        new Member({email: 'heinz'})
      ]},
      {members: [
        new Member({email: 'heinz'})
      ]},
      {members: [
        new Member({email: 'hans'})
      ]},
      {members: [
        new Member({email: 'elfriede'})
      ]}
    ];
    message.setBccToGroupMemberAddresses(groups);
    expect(message.bcc).to.deep.equal(['heinz', 'hans', 'elfriede']);
  });

  it('is not filled by empty members', function () {
    var message = new Message();
    var members = [];
    message.setBccToMemberAddresses(members);
    expect(message.bcc).to.be.empty;
  });

  it('is filled by members', function () {
    var message = new Message();
    var members = [
      new Member({email: 'heinz'}),
      new Member({email: 'hans'}),
      new Member({email: 'elfriede'})
    ];
    message.setBccToMemberAddresses(members);
    expect(message.bcc).to.deep.equal(['heinz', 'hans', 'elfriede']);
  });
});

describe('Message Object to TransportObject', function () {
  
  it('converts the sender address to use the provided technical email address', function () {
    var member = new Member({firstname: 'Hans', lastname: 'Dampf', email: 'E-Mail'});
    var message = new Message({}, member);
    var transportObject = message.toTransportObject('dummy');
    expect(transportObject.from).to.equal('"Hans Dampf via softwerkskammer.org" <dummy>');
  });
  
  it('converts the sender address to use it as replyTo', function () {
    var member = new Member({firstname: 'Hans', lastname: 'Dampf', email: 'E-Mail'});
    var message = new Message({}, member);
    var transportObject = message.toTransportObject('dummy');
    expect(transportObject.replyTo).to.equal('"Hans Dampf" <E-Mail>');
  });
  
});

describe('Message Object\'s buttons', function () {
  
  it('handles one button', function () {
    var message = new Message();
    var button = {text: 'text', url: 'url'};
    message.addToButtons(button);
    expect(message.buttons).to.deep.equal([button]);
  });
  
  it('handles two buttons', function () {
    var message = new Message();
    var button1 = {text: 'text', url: 'url'};
    var button2 = {text: 'text2', url: 'url2'};
    message.addToButtons(button1);
    message.addToButtons(button2);
    expect(message.buttons).to.deep.equal([button1, button2]);
  });
  
  it('handles two buttons already an array', function () {
    var message = new Message();
    var button1 = {text: 'text', url: 'url'};
    var button2 = {text: 'text2', url: 'url2'};
    message.addToButtons([button1, button2]);
    expect(message.buttons).to.deep.equal([button1, button2]);
  });
  
});

