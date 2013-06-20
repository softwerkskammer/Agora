"use strict";

var conf = require('../configureForTest');
var expect = require('chai').expect;

var sinon = require('sinon');
var sinonSandbox = sinon.sandbox.create();

var persistence = conf.get('beans').get('mailsPersistence');
var membersAPI = conf.get('beans').get('membersAPI');
var mailarchiveAPI = conf.get('beans').get('mailarchiveAPI');
var Mail = conf.get('beans').get('archivedMail');

describe('Mailarchive', function () {

  afterEach(function (done) {
    sinonSandbox.restore();
    done();
  });

  it('calls persistence.listByFieldWithOptions from mailHeaders ' +
    'and passes on the given callback', function (done) {
    var sampleMail1 = new Mail({ subject: "Mail 1" });
    var sampleMail2 = new Mail({ subject: "Mail 2" });
    var sampleMailList = [sampleMail1, sampleMail2];
    var listByFieldWithOptions = sinonSandbox.stub(persistence, 'listByFieldWithOptions');
    listByFieldWithOptions.callsArgWith(3, null, sampleMailList);

    mailarchiveAPI.mailHeaders('group', function (err, mails) {
      expect(listByFieldWithOptions.calledWith(
        {group: 'group'},
        {text: 0, html: 0},
        {timeUnix: -1}
      )).to.be.true;
      expect(err).to.be.null;
      expect(mails).to.deep.equal(sampleMailList);
      done(err);
    });
  });

  it('calls persistence.getById from mailForId and passes on the given callback', function (done) {
    var sampleMail1 = new Mail({ subject: "Mail 1" });
    var getById = sinonSandbox.stub(persistence, 'getById');
    getById.callsArgWith(1, null, sampleMail1);

    mailarchiveAPI.mailForId('id', function (err, mail) {
      expect(getById.calledWith('id')).to.be.true;
      expect(err).to.be.null;
      expect(mail).to.deep.equal(sampleMail1);
      done(err);
    });
  });

  it('calls membersAPI.getMemberForId from addMemberNick with member id from given object ' +
    'and adds member nick returned in callback to mail header', function (done) {
    var sampleMember = {id: "sender ID 1", nickname: 'nick1'};
    var sampleMail1 = new Mail({ subject: "Mail 1", from: {name: "Sender Name 1", id: sampleMember.id} });

    var getMemberForId = sinonSandbox.stub(membersAPI, 'getMemberForId');
    getMemberForId.callsArgWith(1, null, sampleMember);

    mailarchiveAPI.addMemberNick(sampleMail1, function (err) {
      expect(getMemberForId.calledWith(sampleMember.id)).to.be.true;
      expect(err).to.be.null;
      expect(sampleMail1.memberNickname).to.equal(sampleMember.nickname);
      done(err);
    });
  });

  it('calls membersAPI.getMembersForIds from addMemberNicks with member ids from given objects ' +
    'and adds matching member nicks returned in callback to mail headers', function (done) {
    var sampleMember1 = {id: "sender ID 1", nickname: 'nick1'};
    var sampleMember2 = {id: "sender ID 2", nickname: 'nick2'};
    var sampleMemberList = [sampleMember1, sampleMember2];
    var sampleMail1 = new Mail({ subject: "Mail 1", from: {name: "Sender Name 1", id: sampleMember1.id} });
    var sampleMail2 = new Mail({ subject: "Mail 2", from: {name: "Sender Name 2", id: sampleMember2.id} });
    var sampleMailList = [sampleMail1, sampleMail2];

    var getMembersForIds = sinonSandbox.stub(membersAPI, 'getMembersForIds');
    getMembersForIds.callsArgWith(1, null, sampleMemberList);

    mailarchiveAPI.addMemberNicks(sampleMailList, function (err) {
      expect(getMembersForIds.calledWith(
        Object.keys({"sender ID 1": null, "sender ID 2": null})
      )).to.be.true;
      expect(err).to.be.null;
      expect(sampleMail1.memberNickname).to.equal(sampleMember1.nickname);
      expect(sampleMail2.memberNickname).to.equal(sampleMember2.nickname);
      done(err);
    });
  });
});
