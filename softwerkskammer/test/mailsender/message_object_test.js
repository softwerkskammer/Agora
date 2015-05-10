'use strict';

require('../../testutil/configureForTest');

var conf = require('simple-configure');
var beans = conf.get('beans');
var publicUrlPrefix = conf.get('publicUrlPrefix');
var expect = require('must');
var Message = beans.get('message');
var Member = beans.get('member');

describe('Message Object\'s bcc', function () {
  it('can handle "null" groups', function () {
    var message = new Message();
    var groups = [null];
    message.setBccToGroupMemberAddresses(groups);
    expect(message.bcc).to.be.empty();
  });

  it('is not filled by empty groups', function () {
    var message = new Message();
    var groups = [];
    message.setBccToGroupMemberAddresses(groups);
    expect(message.bcc).to.be.empty();
  });

  it('is not filled by groups with no members', function () {
    var message = new Message();
    var groups = [
      {members: []},
      {members: []},
      {members: []}
    ];
    message.setBccToGroupMemberAddresses(groups);
    expect(message.bcc).to.be.empty();
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
    expect(message.bcc).to.eql(['heinz', 'hans', 'elfriede']);
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
    expect(message.bcc).to.eql(['heinz', 'hans', 'elfriede']);
  });

  it('can handle "null" members', function () {
    var message = new Message();
    var members = [null];
    message.setBccToMemberAddresses(members);
    expect(message.bcc).to.be.empty();
  });

  it('is not filled by empty members', function () {
    var message = new Message();
    var members = [];
    message.setBccToMemberAddresses(members);
    expect(message.bcc).to.be.empty();
  });

  it('is filled by members', function () {
    var message = new Message();
    var members = [
      new Member({email: 'heinz'}),
      new Member({email: 'hans'}),
      new Member({email: 'elfriede'})
    ];
    message.setBccToMemberAddresses(members);
    expect(message.bcc).to.eql(['heinz', 'hans', 'elfriede']);
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

  it('uses absolute URLs in html', function () {
    var message = new Message();
    message.setMarkdown("[link](/url)");
    var transportObject = message.toTransportObject('dummy');
    expect(transportObject.html).to.contain('<a href="' + publicUrlPrefix + '/url">link</a>');
  });

  it('uses absolute URLs in text', function () {
    var message = new Message();
    message.setMarkdown("[link](/url)");
    var transportObject = message.toTransportObject('dummy');
    expect(transportObject.text).to.contain('[link](' + publicUrlPrefix + '/url');
  });
});

describe('Message Object\'s buttons', function () {

  it('handles one button', function () {
    var message = new Message();
    var button = {text: 'text', url: 'url'};
    message.addToButtons(button);
    expect(message.buttons).to.eql([button]);
  });

  it('handles two buttons', function () {
    var message = new Message();
    var button1 = {text: 'text', url: 'url'};
    var button2 = {text: 'text2', url: 'url2'};
    message.addToButtons(button1);
    message.addToButtons(button2);
    expect(message.buttons).to.eql([button1, button2]);
  });

  it('handles two buttons already an array', function () {
    var message = new Message();
    var button1 = {text: 'text', url: 'url'};
    var button2 = {text: 'text2', url: 'url2'};
    message.addToButtons([button1, button2]);
    expect(message.buttons).to.eql([button1, button2]);
  });

  describe('removeAllButFirst function', function () {
    it('removes no buttons if only one', function () {
      var message = new Message();
      var button = {text: 'text', url: 'url'};
      message.addToButtons(button);
      message.removeAllButFirstButton();
      expect(message.buttons).to.eql([button]);
    });

    it('removes buttons if more than one', function () {
      var message = new Message();
      var button1 = {text: 'text', url: 'url'};
      var button2 = {text: 'text2', url: 'url2'};
      message.addToButtons([button1, button2]);
      message.removeAllButFirstButton();
      expect(message.buttons).to.eql([button1]);
    });
  });
});

