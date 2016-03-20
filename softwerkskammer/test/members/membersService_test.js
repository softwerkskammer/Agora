'use strict';

var expect = require('must-dist');
var sinon = require('sinon').sandbox.create();
var beans = require('../../testutil/configureForTest').get('beans');

var Member = beans.get('member');
var memberstore = beans.get('memberstore');
var membersService = beans.get('membersService');
var avatarProvider = beans.get('avatarProvider');

describe('MembersService', function () {
  var imagePath = __dirname + '/../gallery/fixtures/image.jpg';
  var member;

  beforeEach(function () {
    member = new Member();
    sinon.stub(memberstore, 'getMember', function (nickname, callback) {
      if (new RegExp(nickname, 'i').test('hada')) {
        return callback(null, member);
      }
      callback(null, null);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('checking nicknames', function () {

    it('regards various nicknames as reserved words, ignoring the case', function () {
      expect(membersService.isReserved('edit')).to.be(true);
      expect(membersService.isReserved('eDit')).to.be(true);
      expect(membersService.isReserved('neW')).to.be(true);
      expect(membersService.isReserved('checknicKName')).to.be(true);
      expect(membersService.isReserved('submIt')).to.be(true);
      expect(membersService.isReserved('administration')).to.be(true);
      expect(membersService.isReserved('.')).to.be(true);
      expect(membersService.isReserved('..')).to.be(true);
    });

    it('accepts untrimmed versions of reserved words', function (done) {
      membersService.isValidNickname(' checknicKName ', function (err, result) {
        expect(result).to.be(true);
        done(err);
      });
    });

    it('rejects nicknames that already exist, ignoring case', function (done) {
      membersService.isValidNickname('haDa', function (err, result) {
        expect(result).to.be(false);
        done(err);
      });
    });

    it('rejects nicknames that contain an "/"', function (done) {
      membersService.isValidNickname('ha/ha', function (err, result) {
        expect(result).to.be(false);
        done(err);
      });
    });

    it('accepts nicknames that do not exist', function (done) {
      membersService.isValidNickname('haha', function (err, result) {
        expect(result).to.be(true);
        done(err);
      });
    });

    it('accepts nicknames that contain other nicknames', function (done) {
      membersService.isValidNickname('Sc' + 'hada' + 'r', function (err, result) {
        expect(result).to.be(true);
        done(err);
      });
    });

    it('accepts untrimmed versions of nicknames that already exist', function (done) {
      membersService.isValidNickname(' hada ', function (err, result) {
        expect(result).to.be(true);
        done(err);
      });
    });

    it('accepts nicknames containing ".." and "."', function () {
      expect(membersService.isReserved('a..')).to.be(false);
      expect(membersService.isReserved('a.')).to.be(false);
      expect(membersService.isReserved('..a')).to.be(false);
      expect(membersService.isReserved('.a')).to.be(false);
    });

  });

  describe('"toWordList"', function () {
    it('trims simple interest strings', function () {
      var members = [];
      members.push(new Member({interests: 'Heinz, Becker'}));
      var result = membersService.toWordList(members);
      expect(result[0]).to.include('Heinz');
      expect(result[1]).to.include('Becker');
    });

    it('sums tags inside one member', function () {
      var members = [];
      members.push(new Member({interests: 'Heinz, Heinz'}));
      var result = membersService.toWordList(members);
      expect(result).to.have.length(1);
      expect(result[0]).to.eql({text: 'Heinz', weight: 2, html: {class: 'interestify'}});
    });

    it('uses the most common writing', function () {
      var members = [];
      members.push(new Member({interests: 'heinz, Heinz, HeInZ, Heinz, Heinz, heinz'}));
      var result = membersService.toWordList(members);
      expect(result).to.have.length(1);
      expect(result[0]).to.eql({text: 'Heinz', weight: 6, html: {class: 'interestify'}});
    });

    it('sums tags of two members', function () {
      var members = [];
      members.push(new Member({interests: ' Heinz'}));
      members.push(new Member({interests: 'Heinz  '}));
      var result = membersService.toWordList(members);
      expect(result).to.have.length(1);
      expect(result[0]).to.eql({text: 'Heinz', weight: 2, html: {class: 'interestify'}});
    });

    it('handles empty interests tags', function () {
      var members = [];
      members.push(new Member({}));
      members.push(new Member({interests: 'Heinz  '}));
      var result = membersService.toWordList(members);
      expect(result).to.have.length(1);
      expect(result[0]).to.eql({text: 'Heinz', weight: 1, html: {class: 'interestify'}});
    });

    it('keeps " and \'', function () {
      var members = [];
      members.push(new Member({interests: ' "H\'ei"nz"'}));
      var result = membersService.toWordList(members);
      expect(result).to.have.length(1);
      expect(result[0]).to.eql({text: '"H\'ei"nz"', weight: 1, html: {class: 'interestify'}});
    });

    it('keeps ( and )', function () {
      var members = [];
      members.push(new Member({interests: 'Patterns (nicht nur im Code, sondern vor allem beim Lernen)'}));
      var result = membersService.toWordList(members);
      expect(result).to.have.length(2);
      expect(result[0]).to.eql({text: 'Patterns (nicht nur im Code', weight: 1, html: {class: 'interestify'}});
      expect(result[1]).to.eql({text: 'sondern vor allem beim Lernen)', weight: 1, html: {class: 'interestify'}});
    });
  });

  describe('"toUngroupedWordList"', function () {
    it('trims simple interest strings and sorts them', function () {
      var members = [];
      members.push(new Member({interests: 'Heinz, Becker'}));
      var result = membersService.toUngroupedWordList(members);
      expect(result[0]).to.include('Becker');
      expect(result[1]).to.include('Heinz');
    });

    it('sums tags inside one member', function () {
      var members = [];
      members.push(new Member({interests: 'Heinz, Heinz'}));
      var result = membersService.toUngroupedWordList(members);
      expect(result).to.have.length(1);
      expect(result[0]).to.eql({text: 'Heinz', weight: 2, html: {class: 'interestify'}});
    });

    it('returns one entry for each writing', function () {
      var members = [];
      members.push(new Member({interests: 'Heinz, heinz, HeInZ, Heinz, Heinz, heinz'}));
      var result = membersService.toUngroupedWordList(members);
      expect(result).to.have.length(3);
      expect(result[0]).to.eql({text: 'HeInZ', weight: 1, html: {class: 'interestify'}});
      expect(result[1]).to.eql({text: 'Heinz', weight: 3, html: {class: 'interestify'}});
      expect(result[2]).to.eql({text: 'heinz', weight: 2, html: {class: 'interestify'}});
    });

    it('sums tags of two members', function () {
      var members = [];
      members.push(new Member({interests: ' Heinz'}));
      members.push(new Member({interests: 'Heinz  '}));
      var result = membersService.toUngroupedWordList(members);
      expect(result).to.have.length(1);
      expect(result[0]).to.eql({text: 'Heinz', weight: 2, html: {class: 'interestify'}});
    });

    it('handles empty interests tags', function () {
      var members = [];
      members.push(new Member({}));
      members.push(new Member({interests: 'Heinz  '}));
      var result = membersService.toUngroupedWordList(members);
      expect(result).to.have.length(1);
      expect(result[0]).to.eql({text: 'Heinz', weight: 1, html: {class: 'interestify'}});
    });

    it('keeps " and \'', function () {
      var members = [];
      members.push(new Member({interests: ' "H\'ei"nz"'}));
      var result = membersService.toUngroupedWordList(members);
      expect(result).to.have.length(1);
      expect(result[0]).to.eql({text: '"H\'ei"nz"', weight: 1, html: {class: 'interestify'}});
    });

    it('keeps ( and )', function () {
      var members = [];
      members.push(new Member({interests: 'Patterns (nicht nur im Code, sondern vor allem beim Lernen)'}));
      var result = membersService.toUngroupedWordList(members);
      expect(result).to.have.length(2);
      expect(result[0]).to.eql({text: 'Patterns (nicht nur im Code', weight: 1, html: {class: 'interestify'}});
      expect(result[1]).to.eql({text: 'sondern vor allem beim Lernen)', weight: 1, html: {class: 'interestify'}});
    });
  });

  describe('avatar functions', function () {
    var saveMember;
    var getImageFromAvatarProvider;
    var gravatarData;

    beforeEach(function () {
      saveMember = sinon.stub(memberstore, 'saveMember', function (anyMember, callback) { callback(); });
      gravatarData = {image: 'the image', hasNoImage: false};
      getImageFromAvatarProvider = sinon.stub(avatarProvider, 'getImage', function (anyMember, callback) {
        callback(gravatarData);
      });
    });

    it('updates a member with information about a saved avatar', function (done) {
      var files = {image: [{path: imagePath}]};
      var params = {};
      membersService.saveCustomAvatarForNickname('hada', files, params, function (err) {
        expect(saveMember.called).to.be(true);
        var mem = saveMember.args[0][0];
        expect(mem.hasCustomAvatar()).to.be.true();
        done(err);
      });
    });

    it('removes information from member about a deleted avatar', function (done) {
      var files = {image: [{path: imagePath}]};
      var params = {};
      member.state.customAvatar = 'assa.jpg';
      membersService.saveCustomAvatarForNickname('hada', files, params, function () {
        membersService.deleteCustomAvatarForNickname('hada', function (err) {
          expect(saveMember.called).to.be(true);
          var mem = saveMember.args[0][0];
          expect(mem.hasCustomAvatar()).to.be.false();
          done(err);
        });
      });
    });

    it('loads the custom avatar mini picture into the member', function (done) {
      var files = {image: [{path: imagePath}]};
      var params = {};
      member.state.nickname = 'hada';
      membersService.saveCustomAvatarForNickname('hada', files, params, function () {
        membersService.putAvatarIntoMemberAndSave(member, function (err) {
          expect(member.inlineAvatar()).to.match(/^data:image\/jpeg;base64,\/9j/);
          done(err);
        });
      });
    });

    it('updating the avatar from gravatar does not happen when there is a custom avatar', function (done) {
      var files = {image: [{path: imagePath}]};
      var params = {};
      member.state.nickname = 'hada';
      membersService.saveCustomAvatarForNickname('hada', files, params, function () {
        membersService.updateImage(member, function (err) {
          expect(member.inlineAvatar()).to.match(/^data:image\/jpeg;base64,\/9j/);
          done(err);
        });
      });
    });

    it('does not load any image into the member if the member\'s custom avatar cannot be found', function (done) {
      member.state.customAvatar = 'myNonexistentPic.jpg';
      expect(member.inlineAvatar()).to.match('');

      membersService.putAvatarIntoMemberAndSave(member, function (err) {
        expect(member.inlineAvatar()).to.match('');
        done(err);
      });
    });

    it('a member without a custom avatar loads it from gravatar and persists it', function (done) {
      membersService.putAvatarIntoMemberAndSave(member, function (err) {
        expect(member.state.avatardata).to.be(gravatarData);
        expect(getImageFromAvatarProvider.called).to.be(true);
        expect(saveMember.called).to.be(true);
        done(err);
      });
    });

    it('a member takes the persisted one if it is actual enough', function (done) {
      member.state.avatardata = gravatarData;
      membersService.putAvatarIntoMemberAndSave(member, function (err) {
        expect(member.state.avatardata).to.be(gravatarData);
        expect(getImageFromAvatarProvider.called).to.be(false);
        expect(saveMember.called).to.be(false);
        done(err);
      });
    });

    it('loads it again if it is potentially outdated and saves it even though it is equal', function (done) {
      member.state.avatardata = {image: 'the image', hasNoImage: false};

      membersService.updateImage(member, function (err) {
        expect(member.state.avatardata.image).to.eql(gravatarData.image);
        expect(getImageFromAvatarProvider.called).to.be(true);
        expect(saveMember.called).to.be(true);
        done(err);
      });
    });

    it('loads it again if it is potentially outdated but does not save it if it is equal', function (done) {
      member.state.avatardata = {
        image: 'another image',
        hasNoImage: false
      };
      membersService.updateImage(member, function (err) {
        expect(member.state.avatardata).to.be(gravatarData);
        expect(getImageFromAvatarProvider.called).to.be(true);
        expect(saveMember.called).to.be(true);
        done(err);
      });
    });
  });

  describe('"findMember" function', function () {
    var saveMember;

    beforeEach(function () {
      saveMember = sinon.stub(memberstore, 'saveMember', function (anyMember, callback) { callback(); });

      sinon.stub(memberstore, 'getMemberForAuthentication', function (auth, callback) {
        if (!auth || auth === 'newAuth') {
          return callback();
        }
        if (auth === 'errorAuth') {
          return callback(new Error('error in getMemberForAuthentication'));
        }
        callback(null, member);
      });
    });

    it('returns no member if nobody is logged in and if both authentications are undefined', function (done) {
      membersService.findMemberFor(null, undefined, undefined, function (err, returnedMember) {
        expect(returnedMember).to.not.exist();
        expect(saveMember.called).to.be(false);
        done(err);
      })();
    });

    it('returns no member if nobody is logged in and if the new authentication is undefined while the old one is unknown', function (done) {
      membersService.findMemberFor(null, undefined, 'newAuth', function (err, returnedMember) {
        expect(returnedMember).to.not.exist();
        expect(saveMember.called).to.be(false);
        done(err);
      })();
    });

    it('returns a member if nobody is logged in and if the new authentication is undefined but the old one is known', function (done) {
      membersService.findMemberFor(null, undefined, 'knownAuth', function (err, returnedMember) {
        expect(returnedMember).to.be(member);
        expect(saveMember.called).to.be(false); // also, we do not save the 'undefined' authentication id to the member
        done(err);
      })();
    });

    it('returns no member if nobody is logged in and if the authentication is not known', function (done) {
      membersService.findMemberFor(null, 'newAuth', undefined, function (err, returnedMember) {
        expect(returnedMember).to.not.exist();
        expect(saveMember.called).to.be(false);
        done(err);
      })();
    });

    it('returns an error if nobody is logged in and if there is an error in getMemberForAuthentication', function (done) {
      membersService.findMemberFor(null, 'errorAuth', undefined, function (err, returnedMember) {
        expect(returnedMember).to.not.exist();
        expect(saveMember.called).to.be(false);
        expect(err).to.exist();
        done();
      })();
    });

    it('returns a member if nobody is logged in and if his authentication is known', function (done) {
      membersService.findMemberFor(null, 'knownAuth', undefined, function (err, returnedMember) {
        expect(returnedMember).to.be(member);
        expect(saveMember.called).to.be(false);
        done(err);
      })();
    });

    it('returns a member if nobody is logged in and if the authentication is not known but the legacy authentication is', function (done) {
      membersService.findMemberFor(null, 'newAuth', 'knownAuth', function (err, returnedMember) {
        expect(returnedMember).to.be(member);
        expect(saveMember.called).to.be(true);
        expect(saveMember.args[0][0]).is(member);
        expect(member.authentications()).to.contain('newAuth');
        done(err);
      })();
    });

    it('returns an error if nobody is logged in and if the authentication is not known and getMemberForAuthentication returns an error for the legacy authentication', function (done) {
      membersService.findMemberFor(null, 'newAuth', 'errorAuth', function (err, returnedMember) {
        expect(returnedMember).to.not.exist();
        expect(saveMember.called).to.be(false);
        expect(err).to.exist();
        done();
      })();
    });

    it('adds the new authentication to the sessionmember if user is logged in and authentication not known yet', function (done) {
      var differentMember = new Member();
      differentMember.state.id = 'different ID';
      var user = {member: differentMember};
      membersService.findMemberFor(user, 'newAuth', undefined, function (err, returnedMember) {
        expect(returnedMember).to.be(differentMember);
        expect(saveMember.called).to.be(true);
        expect(saveMember.args[0][0]).is(differentMember);
        expect(differentMember.authentications()).to.contain('newAuth');

        done(err);
      })();
    });

    it('returns an error if user is logged in and getMemberForAuthentication returns an error', function (done) {
      var differentMember = new Member();
      differentMember.state.id = 'different ID';
      var user = {member: differentMember};
      membersService.findMemberFor(user, 'errorAuth', undefined, function (err, returnedMember) {
        expect(returnedMember).to.not.exist();
        expect(saveMember.called).to.be(false);
        expect(err).to.exist();
        done();
      })();
    });

    it('simply returns the found member if the authentication is already known', function (done) {
      member.state.id = 'ID';
      var user = {member: member};
      membersService.findMemberFor(user, 'authID', undefined, function (err, returnedMember) {
        expect(returnedMember).to.be(member);
        expect(saveMember.called).to.be(false);
        done(err);
      })();
    });

    it('returns an error if the found member is not the logged in member', function (done) {
      member.state.id = 'ID';
      var differentMember = new Member();
      differentMember.state.id = 'different ID';
      var user = {member: differentMember};
      membersService.findMemberFor(user, 'authID', undefined, function (err, returnedMember) {
        expect(returnedMember).to.not.exist();
        expect(saveMember.called).to.be(false);
        expect(err).to.exist();
        done();
      })();
    });

  });
});

