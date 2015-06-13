'use strict';

var expect = require('must-dist');
var sinon = require('sinon').sandbox.create();

var beans = require('../../testutil/configureForTest').get('beans');
var Member = beans.get('member');
var avatarProvider = beans.get('avatarProvider');

describe('AvatarProvider', function () {

  afterEach(function () {
    sinon.restore();
  });

  it('tries to load a members avatar via gravatar if it not cached locally', function (done) {
    sinon.stub(avatarProvider, 'imageDataFromGravatar', function (anyMember, callback) {
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
    sinon.stub(avatarProvider, 'imageDataFromCache', function () {
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

