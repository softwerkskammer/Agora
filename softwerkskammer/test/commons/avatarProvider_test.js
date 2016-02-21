'use strict';

var expect = require('must-dist');

var beans = require('../../testutil/configureForTest').get('beans');
var Member = beans.get('member');
var avatarProvider = beans.get('avatarProvider');

describe('AvatarProvider', function () {
  it('loads the gravatar of "leider" from gravatar', function (done) {
    var member = new Member({email: 'derleider@web.de'});
    avatarProvider.getImage(member, function () {
      expect(member.inlineAvatar()).to.match('data:image/jpeg;base64,/9j/4'); // the real picture (volatile)
      expect(member.hasImage()).to.be(true);
      done();
    });
  });

  it('defaults to no image if address has no gravatar', function (done) {
    var member = new Member({email: 'derleider@web.dede'});
    avatarProvider.getImage(member, function () {
      expect(member.inlineAvatar()).to.match('data:image/png;base64,iVBO'); // no image
      expect(member.hasImage()).to.be(false);
      done();
    });
  });

  it('defaults to "null" image if gravatar has errors', function (done) {
    var member = new Member({email: 'derleider@web.de'});
    avatarProvider.getImage(member, function () {
      expect(member.inlineAvatar()).to.be('');
      expect(member.hasImage()).to.be(false);
      done();
    }, 'http://nonexisting.site');
  });
});

