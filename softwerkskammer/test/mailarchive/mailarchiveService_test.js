'use strict';

const expect = require('must-dist');

const sinon = require('sinon').sandbox.create();

const beans = require('../../testutil/configureForTest').get('beans');
const persistence = beans.get('mailsPersistence');
const memberstore = beans.get('memberstore');
const mailarchiveService = beans.get('mailarchiveService');
const Mail = beans.get('archivedMail');
const Member = beans.get('member');

describe('Mailarchive', () => {
  const sampleMail1 = new Mail({id: 'Mail 1', subject: 'Mail 1'});
  const sampleMail2 = new Mail({id: 'Mail 2', subject: 'Mail 2'});
  const memberID = 'memberID';
  const sampleMail3 = new Mail({id: 'Mail 3', subject: 'Mail 3', from: {id: memberID}});
  const sampleMember = new Member({id: 'id'});
  const sampleMailList = [sampleMail1, sampleMail2];
  let listByField;
  let getById;
  const idOfMailWithMember = 'id2';

  beforeEach(() => {
    sinon.stub(memberstore, 'getMemberForId').callsFake((id, callback) => {
      if (id === memberID) { return callback(null, sampleMember); }
      callback(null, null);
    });

    getById = sinon.stub(persistence, 'getById').callsFake((id, callback) => {
      if (id === idOfMailWithMember) { return callback(null, sampleMail3); }
      callback(null, sampleMail1);
    });

    listByField = sinon.stub(persistence, 'listByField').callsFake((searchObject, sortOrder, callback) => {
      callback(null, sampleMailList);
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('calls persistence.listByField from mailHeaders and passes on the given callback', done => {
    mailarchiveService.unthreadedMails('group', (err, mails) => {
      expect(listByField.calledWith({group: 'group'}, {timeUnix: -1})).to.be(true);
      expect(mails).to.eql(sampleMailList);
      done(err);
    });
  });

  it('calls persistence.getById from mailForId and passes on the given callback', done => {
    mailarchiveService.mailForId('id', (err, mail) => {
      expect(getById.calledWith('id')).to.be(true);
      expect(mail).to.eql(sampleMail1);
      done(err);
    });
  });

  it('adds member data to the mail', done => {
    mailarchiveService.mailForId(idOfMailWithMember, (err, mail) => {
      expect(getById.calledWith(idOfMailWithMember)).to.be(true);
      expect(mail.member).to.eql(sampleMember);
      done(err);
    });
  });

});
