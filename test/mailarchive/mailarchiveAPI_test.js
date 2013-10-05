"use strict";

var expect = require('chai').expect;

var sinon = require('sinon');
var sinonSandbox = sinon.sandbox.create();

var beans = require('../configureForTest').get('beans');
var persistence = beans.get('mailsPersistence');
var membersAPI = beans.get('membersAPI');
var mailarchiveAPI = beans.get('mailarchiveAPI');
var Mail = beans.get('archivedMail');

describe('Mailarchive', function () {

  afterEach(function (done) {
    sinonSandbox.restore();
    done();
  });

  it('calls persistence.listByFieldWithOptions from mailHeaders ' +
    'and passes on the given callback', function (done) {
    var sampleMail1 = new Mail({ id: 'Mail 1', subject: 'Mail 1' });
    var sampleMail2 = new Mail({ id: 'Mail 2', subject: 'Mail 2' });
    var sampleMailList = [sampleMail1, sampleMail2];
    var listByField = sinonSandbox.stub(persistence, 'listByField');
    listByField.callsArgWith(2, null, sampleMailList);
    sinonSandbox.stub(membersAPI, 'getMemberForId', function (id, callback) {callback(null, null); });

    mailarchiveAPI.unthreadedMails('group', function (err, mails) {
      expect(listByField.calledWith({group: 'group'}, {timeUnix: -1})).to.be.true;
      expect(err).to.be.null;
      sampleMail1.threadingLevel = 0;
      sampleMail2.threadingLevel = 0;
      expect(mails).to.deep.equal(sampleMailList);
      done(err);
    });
  });

  it('calls persistence.getById from mailForId and passes on the given callback', function (done) {
    var sampleMail1 = new Mail({ id: 'Mail 1', subject: 'Mail 1' });
    var getById = sinonSandbox.stub(persistence, 'getById');
    sinonSandbox.stub(membersAPI, 'getMemberForId', function (ids, callback) {callback(null, null); });
    getById.callsArgWith(1, null, sampleMail1);

    mailarchiveAPI.mailForId('id', function (err, mail) {
      expect(getById.calledWith('id')).to.be.true;
      expect(err).to.be.null;
      expect(mail).to.deep.equal(sampleMail1);
      done(err);
    });
  });

});
