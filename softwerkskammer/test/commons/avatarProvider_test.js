'use strict';

var expect = require('must');
var sinon = require('sinon').sandbox.create();
var conf = require('../../testutil/configureForTest');

var Member = conf.get('beans').get('member');
var avatarProvider = conf.get('beans').get('avatarProvider');

describe('AvatarProvider', function () {

  afterEach(function () {
    sinon.restore();
  });

  it('tries to load a members avatar via gravatar if it not cached locally', function (done) {
    sinon.stub(avatarProvider, 'imageDataFromGravatar', function (member, callback) {
      callback({image: 'image', hasNoImage: true});
    });

    var member = new Member({email: 'Email'});
    avatarProvider.getImage(member, function () {
      expect(member.inlineAvatar()).to.be('image');
      expect(member.hasNoImage).to.be(true);
      done();
    });
  });

  it('Does not load a members avatar via gravatar if it can be retrieved from cache', function (done) {
    sinon.stub(avatarProvider, 'imageDataFromCache', function (member) {
      return {image: 'image', hasNoImage: false};
    });
    var gravatarCall = sinon.spy(avatarProvider, 'imageDataFromGravatar');

    var member = new Member({email: 'Email'});
    avatarProvider.getImage(member, function () {
      expect(member.inlineAvatar()).to.be('image');
      expect(gravatarCall.called).to.be(false);
      done();
    });
  });

});

