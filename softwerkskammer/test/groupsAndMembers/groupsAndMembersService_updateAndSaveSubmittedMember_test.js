'use strict';

const sinon = require('sinon').sandbox.create();
const expect = require('must-dist');

const beans = require('../../testutil/configureForTest').get('beans');
const Member = beans.get('member');
const memberstore = beans.get('memberstore');
const groupsAndMembersService = beans.get('groupsAndMembersService');

describe('Groups and Members Service (updateAndSaveSubmittedMember)', () => {
  let accessrights;

  beforeEach(() => {
    accessrights = {
      isSuperuser: () => false,
      canEditMember: () => false
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  const memberformData = {previousNickname: 'nick', nickname: 'nick in memberform'};
  const member = new Member({id: 'memberId', nickname: 'nick nack'});

  describe('when some error occurs', () => {

    it('returns an error when the member loading caused an error', done => {
      sinon.stub(groupsAndMembersService, 'getMemberWithHisGroups').callsFake((nickname, callback) => { callback(new Error('some error')); });

      groupsAndMembersService.updateAndSaveSubmittedMember(undefined, {previousNickname: 'nick'}, accessrights, undefined, (err, nickname) => {
        expect(err.message).to.equal('some error');
        expect(nickname).to.be.undefined();
        done();
      });
    });

    it('returns an error when the submitted member is a new member and saving the member caused an error', done => {
      sinon.stub(groupsAndMembersService, 'getMemberWithHisGroups').callsFake((nickname, callback) => { callback(null, null); });
      sinon.stub(memberstore, 'saveMember').callsFake((anyMember, callback) => { callback(new Error('some error')); });

      groupsAndMembersService.updateAndSaveSubmittedMember(undefined, {previousNickname: 'nick'}, accessrights, undefined, (err, nickname) => {
        expect(err.message).to.equal('some error');
        expect(nickname).to.be.undefined();
        done();
      });
    });

    it('returns an error when the submitted member is an existing member and we are allowed to edit the member but saving causes an error', done => {
      sinon.stub(groupsAndMembersService, 'getMemberWithHisGroups').callsFake((nickname, callback) => { callback(null, member); });
      accessrights.canEditMember = () => true;
      sinon.stub(memberstore, 'saveMember').callsFake((anyMember, callback) => { callback(new Error('some error')); });

      groupsAndMembersService.updateAndSaveSubmittedMember(undefined, memberformData, accessrights, undefined, (err, nickname) => {
        expect(err.message).to.equal('some error');
        expect(nickname).to.be.undefined();
        done();
      });
    });

  });

  describe('when the submitted member is a new member', () => {

    beforeEach(() => {
      sinon.stub(memberstore, 'saveMember').callsFake((anyMember, callback) => { callback(null); });
      sinon.stub(groupsAndMembersService, 'getMemberWithHisGroups').callsFake((nickname, callback) => { callback(null, null); });
      sinon.stub(groupsAndMembersService, 'updateSubscriptions').callsFake((anyMember, oldEmail, subscriptions, callback) => { callback(null); });
    });

    it('adds the new member to the sessionUser', done => {
      const sessionUser = {authenticationId: 'member authentication id'};
      accessrights.canEditMember = () => true;

      groupsAndMembersService.updateAndSaveSubmittedMember(sessionUser, memberformData, accessrights, () => { return; },
        (err, nickname) => {
          expect(nickname).to.equal('nick in memberform');
          expect(sessionUser.member.id()).to.equal('member authentication id');
          done(err);
        });
    });
  });

  describe('when the submitted member is an existing member', () => {

    beforeEach(() => {
      sinon.stub(memberstore, 'saveMember').callsFake((anyMember, callback) => { callback(null); });
      sinon.stub(groupsAndMembersService, 'getMemberWithHisGroups').callsFake((nickname, callback) => { callback(null, member); });
      sinon.stub(groupsAndMembersService, 'updateSubscriptions').callsFake((anyMember, oldEmail, subscriptions, callback) => { callback(null); });
    });

    it('returns null when we are not allowed to edit the member', done => {
      groupsAndMembersService.updateAndSaveSubmittedMember(undefined, memberformData, accessrights, undefined, (err, nickname) => {
        expect(err).to.be.null();
        expect(nickname).to.be.undefined();
        done();
      });
    });

    it('adds the member to and removes the profile from the sessionUser when the sessionUser does not contain a member', done => {
      const sessionUser = {profile: {}};
      accessrights.canEditMember = () => true;

      groupsAndMembersService.updateAndSaveSubmittedMember(sessionUser, memberformData, accessrights, undefined, (err, nickname) => {
        expect(nickname).to.equal('nick in memberform');
        expect(sessionUser.member).to.equal(member);
        expect(sessionUser.hasOwnProperty('profile')).to.be.false();
        done(err);
      });
    });

    it('modifies the sessionUser when the sessionUser contains a member with the same id', done => {
      const differentMemberWithSameId = new Member({id: 'memberId'});
      const sessionUser = {member: differentMemberWithSameId};
      accessrights.canEditMember = () => true;

      groupsAndMembersService.updateAndSaveSubmittedMember(sessionUser, memberformData, accessrights, undefined, (err, nickname) => {
        expect(nickname).to.equal('nick in memberform');
        expect(sessionUser.member).to.equal(member);
        expect(sessionUser.member).to.not.equal(differentMemberWithSameId);
        done(err);
      });
    });

    it('does not modify the sessionUser when the sessionUser contains a member with a different id', done => {
      const anotherMember = new Member({id: 'anotherMemberId'});
      const sessionUser = {member: anotherMember};
      accessrights.canEditMember = () => true;

      groupsAndMembersService.updateAndSaveSubmittedMember(sessionUser, memberformData, accessrights, undefined, (err, nickname) => {
        expect(nickname).to.equal('nick in memberform');
        expect(sessionUser.member).to.equal(anotherMember);
        done(err);
      });
    });

  });
});
