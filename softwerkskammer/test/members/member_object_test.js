'use strict';

const expect = require('must-dist');

const Member = require('../../testutil/configureForTest').get('beans').get('member');

describe('Member initial filling', () => {

  it('is correctly filled from small database record', () => {
    const dbRecord = {id: 'ID', nickname: 'NICK'};
    const member = new Member(dbRecord);
    expect(member.id()).to.equal(dbRecord.id);
    expect(member.nickname()).to.equal(dbRecord.nickname);
  });

  it('is populated by Google OpenID record', () => {
    const userdata = {
      authenticationId: 'https://www.google.com/accounts/o8/id?id=someGoogelID',
      profile: {displayName: 'Hans Dampf', emails: [{value: 'hada@web.de'}], name: {familyName: 'Dampf', givenName: 'Hans'}}
    };

    const member = new Member().initFromSessionUser(userdata);

    expect(member.firstname()).to.equal('Hans');
    expect(member.lastname()).to.equal('Dampf');
    expect(member.email()).to.equal('hada@web.de');
  });

  it('is populated by GitHub record', () => {
    const userdata = {
      authenticationId: 'github:123456',
      profile: {
        provider: 'github', id: 123456, displayName: 'Hans Dampf', username: 'hada', profileUrl: 'https://github.com/hansdampf', emails: [{value: null}],
        _json: {'html_url': 'https://github.com/hansdampf', blog: 'http://hada.wordpress.com'}
      }
    };

    const member = new Member().initFromSessionUser(userdata);
    expect(member.firstname()).not.to.exist();
    expect(member.lastname()).not.to.exist();
    expect(member.site()).to.equal('https://github.com/hansdampf, http://hada.wordpress.com');
  });

  it('is populated by GitHub record with only github url', () => {
    const userdata = {
      authenticationId: 'github:123456',
      profile: {
        provider: 'github', id: 123456, displayName: 'Hans Dampf', username: 'hada', profileUrl: 'https://github.com/hansdampf', emails: [{value: null}],
        _json: {'html_url': 'https://github.com/hansdampf', blog: undefined}
      }
    };

    const member = new Member().initFromSessionUser(userdata);
    expect(member.firstname()).not.to.exist();
    expect(member.lastname()).not.to.exist();
    expect(member.site()).to.equal('https://github.com/hansdampf');
  });

  it('is populated with empty fields where no information is given', () => {
    const record = {
      id: 'testuser',
      nickname: 'testNick',
      email: 'mail@google.de',
      firstname: 'Test',
      lastname: 'User'
    };
    const member = new Member(record);
    expect(member.twitter()).not.to.exist();
    expect(member.location()).not.to.exist();
    expect(member.profession()).not.to.exist();
    expect(member.state.interests).not.to.exist();
    expect(member.interests()).to.eql('');
    expect(member.site()).not.to.exist();
    expect(member.reference()).not.to.exist();
  });

  it('shows the full name as display-name', () => {
    const dbRecord = {nickname: 'Nick', firstname: 'Hans', lastname: 'Dampf'};
    const member = new Member(dbRecord);
    expect(member.displayName()).to.equal('Hans Dampf');
  });
});

describe('fillFromUI', () => {
  it('leaves fields undefined / false where no information is given', () => {
    const record = {
      nickname: 'testNick',
      email: 'mail@google.de',
      firstname: 'Test',
      lastname: 'User'
    };
    const member = new Member().fillFromUI(record);
    expect(member.twitter()).not.to.exist();
    expect(member.location()).not.to.exist();
    expect(member.profession()).not.to.exist();
    expect(member.state.interests).not.to.exist();
    expect(member.interests()).to.eql('');
    expect(member.site()).not.to.exist();
    expect(member.reference()).not.to.exist();
    expect(member.notifyOnWikiChanges()).to.be.false();
  });

  it('trims the contents of all fields', () => {
    const record = {
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
      notifyOnWikiChanges: ' X '
    };
    const member = new Member().fillFromUI(record);
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
  });

  it('handles interests correctly - saving as string without blanks for legacy compatibilty - but displaying it with blanks', () => {
    const record = {
      interests: ['Everything', 'And more'],
    };
    const member = new Member().fillFromUI(record);
    expect(member.state.interests).to.equal('Everything,And more');
    expect(member.interests()).to.equal('Everything, And more');
  });

});

describe('Member twitter field autocorrection', () => {
  it('is autocorrecting the twittername removing leading @', () => {
    const member = new Member().fillFromUI({twitter: '@twitter'});
    expect(member.twitter()).to.equal('twitter');
  });

  it('is not autocorrecting the twittername when already no leading @', () => {
    const member = new Member().fillFromUI({twitter: 'twitter'});
    expect(member.twitter()).to.equal('twitter');
  });

  it('is adding http:// when not provided', () => {
    const member = new Member().fillFromUI({site: 'twitter'});
    expect(member.site()).to.equal('http://twitter');
  });

  it('is not adding http:// when already provided', () => {
    const member = new Member().fillFromUI({site: 'http://twitter'});
    expect(member.site()).to.equal('http://twitter');
  });

  it('is not adding http:// when already https:// provided', () => {
    const member = new Member().fillFromUI({site: 'https://twitter'});
    expect(member.site()).to.equal('https://twitter');
  });

});

describe('display functionalities', () => {
  it('produces a valid git author', () => {
    const member = new Member({nickname: 'Nick'});
    expect(member.asGitAuthor()).to.equal('Nick <Nick@softwerkskammer.org>');
  });
});

describe('utility functions', () => {
  it('gives superuser email addresses', () => {
    const member = new Member({id: 'superuserID', email: 'email1'});
    expect(Member.superuserEmails([member])).to.contain('email1');
  });

  it('gives wikichange email addresses', () => {
    const member = new Member({notifyOnWikiChanges: true, email: 'email1'});
    expect(Member.wikiNotificationMembers([member])).to.contain('email1');
  });

  it('can tell if the member is member of a group', () => {
    const member = new Member();
    member.subscribedGroups = [
      {id: 'group'},
      {id: 'anotherGroup'}
    ];
    expect(member.isInGroup('group')).to.be(true);
  });

  it('can tell if the member is not member of a group', () => {
    const member = new Member();
    member.subscribedGroups = [
      {id: 'anotherGroup'}
    ];
    expect(member.isInGroup('group')).to.be(false);
  });

  it('fills its only subscribed group', () => {
    const member = new Member({email: 'myEmail'});
    const group = {id: 'group'};
    member.fillSubscribedGroups({group: ['myemail']}, [group, {id: 'groupb'}]);
    expect(member.subscribedGroups).to.have.length(1);
    expect(member.subscribedGroups).to.contain(group);
  });

  it('fills its more than one subscribed group', () => {
    const member = new Member({email: 'myEmail'});
    const group = {id: 'group'};
    const groupb = {id: 'groupb'};
    member.fillSubscribedGroups({group: ['myemail'], groupb: ['myemail']}, [group, groupb]);
    expect(member.subscribedGroups).to.have.length(2);
    expect(member.subscribedGroups).to.contain(group);
    expect(member.subscribedGroups).to.contain(groupb);
  });

  it('does not add a subscription only if it is empty', () => {
    const member = new Member({});
    member.addAuthentication('');
    expect(member.authentications()).to.have.length(0);
  });

  it('adds a subscription if it is not empty', () => {
    const member = new Member({});
    member.addAuthentication('auth');
    expect(member.authentications()).to.have.length(1);
    expect(member.authentications()).to.contain('auth');
  });
});

describe('avatar handling', () => {
  it('constructs avatar from mail address using gravatar URL with https', () => {
    const email = 'member@mail.com';
    const dbRecord = {nickname: 'Nick', email};
    const member = new Member(dbRecord);

    expect(member.avatarUrl(10)).to.contain('https://www.gravatar.com/avatar/');
    expect(member.avatarUrl(10)).to.contain('?d=mm&s=10');
  });

  it('uses size 200 if no size is given', () => {
    const email = 'member@mail.com';
    const dbRecord = {nickname: 'Nick', email};
    const member = new Member(dbRecord);

    expect(member.avatarUrl()).to.contain('?d=mm&s=200');
  });

  it('saves miniicon from gravatar', () => {
    const member = new Member();
    const gravatarIcon = {image: null, hasNoImage: true};
    member.setAvatarData(gravatarIcon);

    expect(member.state.avatardata).to.be(gravatarIcon);
  });

  it('sets avatar miniicon on load if available', () => {
    const gravatarIcon = {image: 'theImage', hasNoImage: false};
    const member = new Member({avatardata: gravatarIcon});

    expect(member.state.avatardata).to.be(gravatarIcon);
    expect(member.inlineAvatar()).to.be('theImage');
    expect(member.hasImage()).to.be(true);
  });

  it('does also save custom icons', () => {
    const member = new Member();
    const gravatarIcon = {image: 'theImage', hasNoImage: false};
    member.setAvatarData(gravatarIcon);

    expect(member.state.avatardata).to.exist();
    expect(member.inlineAvatar()).to.be('theImage');
    expect(member.hasImage()).to.be(true);
  });
});

describe('The interests', () => {

  it('creates an array for the select2 widget (good case)', () => {
    const member = new Member();
    member.state.interests = 'peter,paul und mary';
    expect(member.interestsForSelect2()).to.eql(['peter', 'paul und mary']);
  });

  it('creates an array for the select2 widget (with blanks)', () => {
    const member = new Member();
    member.state.interests = 'peter , paul und mary';
    expect(member.interestsForSelect2()).to.eql(['peter', 'paul und mary']);
  });
});
