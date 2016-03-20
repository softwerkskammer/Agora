'use strict';

var expect = require('must-dist');

var Member = require('../../testutil/configureForTest').get('beans').get('member');

describe('Member initial filling', function () {

  it('is correctly filled from small database record', function () {
    var dbRecord = {id: 'ID', nickname: 'NICK'};
    var member = new Member(dbRecord);
    expect(member.id()).to.equal(dbRecord.id);
    expect(member.nickname()).to.equal(dbRecord.nickname);
  });

  it('is populated by Google OpenID record', function () {
    var userdata = JSON.parse('{' +
      '"authenticationId": "https://www.google.com/accounts/o8/id?id=someGoogelID", "profile": {' +
      '"displayName": "Hans Dampf", "emails" : [{"value": "hada@web.de"}],' +
      '"name": {"familyName": "Dampf","givenName": "Hans"}}}');

    var member = new Member().initFromSessionUser(userdata);
    expect(member.firstname()).to.equal('Hans');
    expect(member.lastname()).to.equal('Dampf');
    expect(member.email()).to.equal('hada@web.de');
  });

  it('is populated by GitHub record', function () {
    var userdata = JSON.parse('{' +
      '"authenticationId": "github:123456", "profile": {' +
      ' "provider" : "github", "id" : 123456, "displayName": "Hans Dampf", "username" :"hada", ' +
      '"profileUrl" : "https://github.com/hansdampf", ' + '"emails" : [ { "value": null } ], ' +
      '"_json" : { "html_url" :"https://github.com/hansdampf", "blog" : "http://hada.wordpress.com" }}}');

    var member = new Member().initFromSessionUser(userdata);
    expect(member.firstname()).not.to.exist();
    expect(member.lastname()).not.to.exist();
    expect(member.site()).to.equal('https://github.com/hansdampf, http://hada.wordpress.com');
  });

  it('is populated by GitHub record with only github url', function () {
    var userdata = JSON.parse('{' +
      '"authenticationId": "github:123456", "profile": {' +
      ' "provider" : "github", "id" : 123456, "displayName": "Hans Dampf", "username" :"hada", ' +
      '"profileUrl" : "https://github.com/hansdampf", ' + '"emails" : [ { "value": null } ], ' +
      '"_json" : { "html_url" :"https://github.com/hansdampf", "blog" : "undefined" }}}');

    var member = new Member().initFromSessionUser(userdata);
    expect(member.firstname()).not.to.exist();
    expect(member.lastname()).not.to.exist();
    expect(member.site()).to.equal('https://github.com/hansdampf');
  });

  it('is populated with empty fields where no information is given', function () {
    var record = {
      id: 'testuser',
      nickname: 'testNick',
      email: 'mail@google.de',
      firstname: 'Test',
      lastname: 'User'
    };
    var member = new Member(record);
    expect(member.twitter()).not.to.exist();
    expect(member.location()).not.to.exist();
    expect(member.profession()).not.to.exist();
    expect(member.interests()).not.to.exist();
    expect(member.site()).not.to.exist();
    expect(member.reference()).not.to.exist();
  });

  it('shows the full name as display-name', function () {
    var dbRecord = {nickname: 'Nick', firstname: 'Hans', lastname: 'Dampf'};
    var member = new Member(dbRecord);
    expect(member.displayName()).to.equal('Hans Dampf');
  });
});

describe('fillFromUI', function () {
  it('leaves fields undefined / false where no information is given', function () {
    var record = {
      nickname: 'testNick',
      email: 'mail@google.de',
      firstname: 'Test',
      lastname: 'User'
    };
    var member = new Member().fillFromUI(record);
    expect(member.twitter()).not.to.exist();
    expect(member.location()).not.to.exist();
    expect(member.profession()).not.to.exist();
    expect(member.interests()).not.to.exist();
    expect(member.site()).not.to.exist();
    expect(member.reference()).not.to.exist();
    expect(member.notifyOnWikiChanges()).to.be.false();
    expect(member.socratesOnly()).to.be.false();
  });

  it('trims the contents of all fields', function () {
    var record = {
      nickname: ' testNick ',
      email: ' mail@google.de ',
      firstname: ' Test ',
      lastname: ' User ',
      twitter: ' @twitti ',
      location: ' somewhere ',
      profession: ' My Job ',
      interests: ['Everything'],
      site: ' www.mypage.de ',
      reference: ' A friend ',
      customAvatar: ' avatar-url ',
      notifyOnWikiChanges: ' X ',
      socratesOnly: 'yes'
    };
    var member = new Member().fillFromUI(record);
    expect(member.nickname()).to.equal('testNick');
    expect(member.email()).to.equal('mail@google.de');
    expect(member.firstname()).to.equal('Test');
    expect(member.lastname()).to.equal('User');
    expect(member.twitter()).to.equal('twitti');
    expect(member.location()).to.equal('somewhere');
    expect(member.profession()).to.equal('My Job');
    expect(member.interests()).to.equal('Everything');
    expect(member.site()).to.equal('http://www.mypage.de');
    expect(member.reference()).to.equal('A friend');
    expect(member.customAvatar()).to.equal('avatar-url');
    expect(member.notifyOnWikiChanges()).to.be.true();
    expect(member.socratesOnly()).to.be.true();
  });

});

describe('Member twitter field autocorrection', function () {
  it('is autocorrecting the twittername removing leading @', function () {
    var member = new Member().fillFromUI({twitter: '@twitter'});
    expect(member.twitter()).to.equal('twitter');
  });

  it('is not autocorrecting the twittername when already no leading @', function () {
    var member = new Member().fillFromUI({twitter: 'twitter'});
    expect(member.twitter()).to.equal('twitter');
  });

  it('is adding http:// when not provided', function () {
    var member = new Member().fillFromUI({site: 'twitter'});
    expect(member.site()).to.equal('http://twitter');
  });

  it('is not adding http:// when already provided', function () {
    var member = new Member().fillFromUI({site: 'http://twitter'});
    expect(member.site()).to.equal('http://twitter');
  });

  it('is not adding http:// when already https:// provided', function () {
    var member = new Member().fillFromUI({site: 'https://twitter'});
    expect(member.site()).to.equal('https://twitter');
  });

});

describe('filling socratesOnly from UI', function () {
  it('sets socratesOnly to false if the field is not provided from UI', function () {
    var member = new Member().fillFromUI({});
    expect(member.socratesOnly()).to.be.false();
  });

  it('sets socratesOnly to false if empty string is provided from UI', function () {
    var member = new Member().fillFromUI({socratesOnly: ''});
    expect(member.socratesOnly()).to.be.false();
  });

  it('sets socratesOnly to true if true is provided from UI', function () {
    var member = new Member().fillFromUI({socratesOnly: true});
    expect(member.socratesOnly()).to.be.true();
  });
});

describe('display functionalities', function () {
  it('produces a valid git author', function () {
    var member = new Member({nickname: 'Nick'});
    expect(member.asGitAuthor()).to.equal('Nick <Nick@softwerkskammer.org>');
  });
});

describe('utility functions', function () {
  it('gives superuser email addresses', function () {
    var member = new Member({id: 'superuserID', email: 'email1'});
    expect(Member.superuserEmails([member])).to.contain('email1');
  });

  it('gives wikichange email addresses', function () {
    var member = new Member({notifyOnWikiChanges: true, email: 'email1'});
    expect(Member.wikiNotificationMembers([member])).to.contain('email1');
  });

  it('can tell if the member is member of a group', function () {
    var member = new Member();
    member.subscribedGroups = [
      {id: 'group'},
      {id: 'anotherGroup'}
    ];
    expect(member.isInGroup('group')).to.be(true);
  });

  it('can tell if the member is not member of a group', function () {
    var member = new Member();
    member.subscribedGroups = [
      {id: 'anotherGroup'}
    ];
    expect(member.isInGroup('group')).to.be(false);
  });

  it('fills its only subscribed group', function () {
    var member = new Member({email: 'myEmail'});
    var group = {id: 'group'};
    member.fillSubscribedGroups({group: ['myemail']}, [group, {id: 'groupb'}]);
    expect(member.subscribedGroups).to.have.length(1);
    expect(member.subscribedGroups).to.contain(group);
  });

  it('fills its more than one subscribed group', function () {
    var member = new Member({email: 'myEmail'});
    var group = {id: 'group'};
    var groupb = {id: 'groupb'};
    member.fillSubscribedGroups({group: ['myemail'], groupb: ['myemail']}, [group, groupb]);
    expect(member.subscribedGroups).to.have.length(2);
    expect(member.subscribedGroups).to.contain(group);
    expect(member.subscribedGroups).to.contain(groupb);
  });

  it('does not add a subscription only if it is empty', function () {
    var member = new Member({});
    member.addAuthentication('');
    expect(member.authentications()).to.have.length(0);
  });

  it('adds a subscription if it is not empty', function () {
    var member = new Member({});
    member.addAuthentication('auth');
    expect(member.authentications()).to.have.length(1);
    expect(member.authentications()).to.contain('auth');
  });
});

describe('avatar handling', function () {
  it('constructs avatar from mail address using gravatar URL with https', function () {
    var email = 'member@mail.com';
    var dbRecord = {nickname: 'Nick', email: email};
    var member = new Member(dbRecord);

    expect(member.avatarUrl(10)).to.contain('https://www.gravatar.com/avatar/');
    expect(member.avatarUrl(10)).to.contain('?d=mm&s=10');
  });

  it('uses size 200 if no size is given', function () {
    var email = 'member@mail.com';
    var dbRecord = {nickname: 'Nick', email: email};
    var member = new Member(dbRecord);

    expect(member.avatarUrl()).to.contain('?d=mm&s=200');
  });

  it('saves miniicon from gravatar', function () {
    var member = new Member();
    var gravatarIcon = {image: null, hasNoImage: true};
    member.setAvatarData(gravatarIcon);

    expect(member.state.avatardata).to.be(gravatarIcon);
  });

  it('sets avatar miniicon on load if available', function () {
    var gravatarIcon = {image: 'theImage', hasNoImage: false};
    var member = new Member({avatardata: gravatarIcon});

    expect(member.state.avatardata).to.be(gravatarIcon);
    expect(member.inlineAvatar()).to.be('theImage');
    expect(member.hasImage()).to.be(true);
  });

  it('does also save custom icons', function () {
    var member = new Member();
    var gravatarIcon = {image: 'theImage', hasNoImage: false};
    member.setAvatarData(gravatarIcon);

    expect(member.state.avatardata).to.exist();
    expect(member.inlineAvatar()).to.be('theImage');
    expect(member.hasImage()).to.be(true);
  });
});
