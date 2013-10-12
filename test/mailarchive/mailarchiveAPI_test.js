"use strict";

var expect = require('chai').expect;

var sinon = require('sinon').sandbox.create();

var beans = require('../configureForTest').get('beans');
var persistence = beans.get('mailsPersistence');
var membersAPI = beans.get('membersAPI');
var mailarchiveAPI = beans.get('mailarchiveAPI');
var Mail = beans.get('archivedMail');

describe('Mailarchive', function () {
  var sampleMail1 = new Mail({ id: 'Mail 1', subject: 'Mail 1' });
  var sampleMail2 = new Mail({ id: 'Mail 2', subject: 'Mail 2' });
  var memberID = 'memberID';
  var sampleMail3 = new Mail({ id: 'Mail 3', subject: 'Mail 3', from: {id: memberID} });
  var sampleMember = {id: 'id'};
  var sampleMailList = [sampleMail1, sampleMail2];
  var listByField;
  var getById;
  var idOfMailWithMember = 'id2';

  beforeEach(function (done) {
    sinon.stub(membersAPI, 'getMemberForId',
      function (id, callback) {
        if (id === memberID) { return callback(null, sampleMember); }
        callback(null, null);
      });

    getById = sinon.stub(persistence, 'getById', function (id, callback) {
      if (id === idOfMailWithMember) { return callback(null, sampleMail3); }
      callback(null, sampleMail1);
    });

    listByField = sinon.stub(persistence, 'listByField', function (searchObject, sortOrder, callback) {
      callback(null, sampleMailList);
    });
    done();
  });

  afterEach(function (done) {
    sinon.restore();
    done();
  });

  it('calls persistence.listByField from mailHeaders and passes on the given callback', function (done) {
    mailarchiveAPI.unthreadedMails('group', function (err, mails) {
      expect(listByField.calledWith({group: 'group'}, {timeUnix: -1})).to.be.true;
      expect(mails).to.deep.equal(sampleMailList);
      done(err);
    });
  });

  it('calls persistence.getById from mailForId and passes on the given callback', function (done) {
    mailarchiveAPI.mailForId('id', function (err, mail) {
      expect(getById.calledWith('id')).to.be.true;
      expect(mail).to.deep.equal(sampleMail1);
      done(err);
    });
  });

  it('adds member data to the mail', function (done) {
    mailarchiveAPI.mailForId(idOfMailWithMember, function (err, mail) {
      expect(getById.calledWith(idOfMailWithMember)).to.be.true;
      expect(mail.member).to.deep.equal(sampleMember);
      done(err);
    });
  });

});
