"use strict";

var conf = require('../configureForTest');
var expect = require('chai').expect;

var mailThread = conf.get('beans').get('mailThread');
var mailarchiveAPI = conf.get('beans').get('mailarchiveAPI');
var Mail = conf.get('beans').get('archivedMail');

describe('mail thread builder', function () {
  it('returns empty array given an empty array', function () {
    var threadedMails = mailThread([]);
    expect(threadedMails).to.deep.equal([]);
  });

  it('returns single mail given a single mail', function () {
    var mail1 = new Mail({id: "Mail 1"});
    var threadedMails = mailThread([mail1]);
    expect(threadedMails).to.deep.equal([mail1]);
  });

  it('builds a thread from two related mails', function () {
    var mail1 = new Mail({id: "Mail 1"});
    var mail2 = new Mail({id: "Mail 2", references: ["Mail 1"]});
    var threadedMails = mailThread([mail1, mail2]);
    mail1.responses = [mail2];
    expect(threadedMails).to.deep.equal([mail1]);
  });

  it('recognizes mail with references to not existing mail ids only as not a thread root', function () {
    var mail2 = new Mail({id: "Mail 2", references: ["Mail 1"]});
    var threadedMails = mailThread([mail2]);
    expect(threadedMails).to.deep.equal([mail2]);
  });

  it('sorts mails with same parent mail', function () {
    var mail1 = new Mail({id: "Mail 1", references: [], timeUnix: 2});
    var mail2 = new Mail({id: "Mail 2", references: [], timeUnix: 1});
    var threadedMails = mailThread([mail2, mail1], mailarchiveAPI.sortOnTimeDescending);
    expect(threadedMails).to.deep.equal([mail1, mail2]);
  });

  it('adds thread modification time to leaf mails', function () {
    var mail1 = new Mail({id: "Mail 1", timeUnix: 1});
    mailThread([mail1]);
    expect(mail1.lastResponse).to.equal(mail1);
  });


  it('adds thread modification time to parent mails', function () {
    var mail1 = new Mail({id: "Mail 1", timeUnix: 1});
    var mail2 = new Mail({id: "Mail 2", timeUnix: 2, references: ["Mail 1"]});
    var mail3 = new Mail({id: "Mail 3", timeUnix: 3, references: ["Mail 1"]});
    mailThread([mail1, mail2, mail3]);
    expect(mail1.lastResponse).to.equal(mail3);
  });

});
