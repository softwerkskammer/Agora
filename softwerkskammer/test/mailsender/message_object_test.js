'use strict';

require('../../testutil/configureForTest');

const conf = require('simple-configure');
const beans = conf.get('beans');
const publicUrlPrefix = conf.get('publicUrlPrefix');
const expect = require('must-dist');
const Message = beans.get('message');
const Member = beans.get('member');

describe('Message Object\'s bcc', () => {
  it('can handle "null" groups', () => {
    const message = new Message();
    const groups = [null];
    message.setBccToGroupMemberAddresses(groups);
    expect(message.bcc).to.be.empty();
  });

  it('is not filled by empty groups', () => {
    const message = new Message();
    const groups = [];
    message.setBccToGroupMemberAddresses(groups);
    expect(message.bcc).to.be.empty();
  });

  it('is not filled by groups with no members', () => {
    const message = new Message();
    const groups = [
      {members: []},
      {members: []},
      {members: []}
    ];
    message.setBccToGroupMemberAddresses(groups);
    expect(message.bcc).to.be.empty();
  });

  it('is filled by groups with members', () => {
    const message = new Message();
    const groups = [
      {members: [new Member({email: 'heinz'})]},
      {members: [new Member({email: 'hans'})]},
      {members: [new Member({email: 'elfriede'})]}
    ];
    message.setBccToGroupMemberAddresses(groups);
    expect(message.bcc).to.eql(['heinz', 'hans', 'elfriede']);
  });

  it('is filled by groups with members and removing duplicates', () => {
    const message = new Message();
    const groups = [
      {members: [new Member({email: 'heinz'})]},
      {members: [new Member({email: 'heinz'})]},
      {members: [new Member({email: 'hans'})]},
      {members: [new Member({email: 'elfriede'})]}
    ];
    message.setBccToGroupMemberAddresses(groups);
    expect(message.bcc).to.eql(['heinz', 'hans', 'elfriede']);
  });

  it('can handle "null" members', () => {
    const message = new Message();
    const members = [null];
    message.setBccToMemberAddresses(members);
    expect(message.bcc).to.be.empty();
  });

  it('is not filled by empty members', () => {
    const message = new Message();
    const members = [];
    message.setBccToMemberAddresses(members);
    expect(message.bcc).to.be.empty();
  });

  it('is filled by members', () => {
    const message = new Message();
    const members = [
      new Member({email: 'heinz'}),
      new Member({email: 'hans'}),
      new Member({email: 'elfriede'})
    ];
    message.setBccToMemberAddresses(members);
    expect(message.bcc).to.eql(['heinz', 'hans', 'elfriede']);
  });
});

describe('Message Object to TransportObject', () => {

  it('converts the sender address to use the provided technical email address', () => {
    const member = new Member({firstname: 'Hans', lastname: 'Dampf', email: 'E-Mail'});
    const message = new Message({}, member);
    const transportObject = message.toTransportObject('dummy');
    expect(transportObject.from).to.equal('"Hans Dampf via softwerkskammer.org" <dummy>');
  });

  it('converts the sender address to use it as replyTo', () => {
    const member = new Member({firstname: 'Hans', lastname: 'Dampf', email: 'E-Mail'});
    const message = new Message({}, member);
    const transportObject = message.toTransportObject('dummy');
    expect(transportObject.replyTo).to.equal('"Hans Dampf" <E-Mail>');
  });

  it('uses absolute URLs in html (relative)', () => {
    const message = new Message();
    message.setMarkdown('[link](/url)');
    const transportObject = message.toTransportObject('dummy');
    expect(transportObject.html).to.contain('<a href="' + publicUrlPrefix + '/url">link</a>');
  });

  it('uses absolute URLs in text (relative)', () => {
    const message = new Message();
    message.setMarkdown('[link](/url)');
    const transportObject = message.toTransportObject('dummy');
    expect(transportObject.text).to.contain('[link](' + publicUrlPrefix + '/url)');
  });

  it('uses absolute URLs in html (already absolute)', () => {
    const message = new Message();
    message.setMarkdown('[link](http://bild.de/url)');
    const transportObject = message.toTransportObject('dummy');
    expect(transportObject.html).to.contain('<a href="http://bild.de/url">link</a>');
  });

  it('uses absolute URLs in text (already absolute)', () => {
    const message = new Message();
    message.setMarkdown('[link](http://bild.de/url)');
    const transportObject = message.toTransportObject('dummy');
    expect(transportObject.text).to.contain('[link](http://bild.de/url)');
  });
});

describe('Message Object\'s buttons', () => {

  it('handles one button', () => {
    const message = new Message();
    const button = {text: 'text', url: 'url'};
    message.addToButtons(button);
    expect(message.buttons).to.eql([button]);
  });

  it('handles two buttons', () => {
    const message = new Message();
    const button1 = {text: 'text', url: 'url'};
    const button2 = {text: 'text2', url: 'url2'};
    message.addToButtons(button1);
    message.addToButtons(button2);
    expect(message.buttons).to.eql([button1, button2]);
  });

  it('handles two buttons already an array', () => {
    const message = new Message();
    const button1 = {text: 'text', url: 'url'};
    const button2 = {text: 'text2', url: 'url2'};
    message.addToButtons([button1, button2]);
    expect(message.buttons).to.eql([button1, button2]);
  });

  describe('removeAllButFirst function', () => {
    it('removes no buttons if only one', () => {
      const message = new Message();
      const button = {text: 'text', url: 'url'};
      message.addToButtons(button);
      message.removeAllButFirstButton();
      expect(message.buttons).to.eql([button]);
    });

    it('removes buttons if more than one', () => {
      const message = new Message();
      const button1 = {text: 'text', url: 'url'};
      const button2 = {text: 'text2', url: 'url2'};
      message.addToButtons([button1, button2]);
      message.removeAllButFirstButton();
      expect(message.buttons).to.eql([button1]);
    });
  });
});

