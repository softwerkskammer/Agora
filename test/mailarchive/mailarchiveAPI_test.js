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
    var sampleMail1 = new Mail({ id: "Mail 1", subject: "Mail 1" });
    var sampleMail2 = new Mail({ id: "Mail 2", subject: "Mail 2" });
    var sampleMailList = [sampleMail1, sampleMail2];
    var listByFieldWithOptions = sinonSandbox.stub(persistence, 'listByFieldWithOptions');
    listByFieldWithOptions.callsArgWith(3, null, sampleMailList);
    sinonSandbox.stub(membersAPI, 'getMembersForIds', function (ids, callback) {callback(null, []); });

    mailarchiveAPI.unthreadedMails('group', function (err, mails) {
      expect(listByFieldWithOptions.calledWith(
        {group: 'group'},
        {text: 0, html: 0},
        {timeUnix: -1}
      )).to.be.true;
      expect(err).to.be.null;
      sampleMail1.threadingLevel = 0;
      sampleMail2.threadingLevel = 0;
      expect(mails).to.deep.equal(sampleMailList);
      done(err);
    });
  });

  it('calls persistence.getById from mailForId and passes on the given callback', function (done) {
    var sampleMail1 = new Mail({ id: "Mail 1", subject: "Mail 1" });
    var getById = sinonSandbox.stub(persistence, 'getById');
    sinonSandbox.stub(membersAPI, 'getMembersForIds', function (ids, callback) {callback(null, []); });
    getById.callsArgWith(1, null, sampleMail1);

    mailarchiveAPI.mailForId('id', function (err, mail) {
      expect(getById.calledWith('id')).to.be.true;
      expect(err).to.be.null;
      expect(mail).to.deep.equal(sampleMail1);
      done(err);
    });
  });

});
