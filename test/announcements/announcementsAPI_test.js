"use strict";

var expect = require('chai').expect;
var conf = require('../configureForTest');
var Announcement = conf.get('beans').get('announcement');
var sinon = require('sinon').sandbox.create();
var membersAPI = conf.get('beans').get('membersAPI');

var announcementUrl = 'eineSchoeneUrl';
var dummyAnnouncement = new Announcement({
  title: 'title',
  url: announcementUrl,
  text: 'text',
  author: 'author',
  fromUnix: 1372464000, // moment.utc('29.06.2013', 'DD.MM.YYYY').unix()
  thruUnix: 1388448000 // moment.utc('31.12.2013', 'DD.MM.YYYY').unix()
});

var store = conf.get('beans').get('announcementstore');

var announcementsAPI = conf.get('beans').get('announcementsAPI');

describe('Announcements API', function () {

  beforeEach(function (done) {
    sinon.stub(store, 'saveAnnouncement', function (announcement, callback) {
      callback(null);
    });
    sinon.stub(store, 'getAnnouncement', function (url, callback) {
      if (url === announcementUrl) {
        return callback(null, dummyAnnouncement);
      }
      callback(null, null);
    });
    sinon.stub(store, 'allAnnouncements', function (callback) {
      callback(null, [dummyAnnouncement]);
    });
    done();
  });

  afterEach(function (done) {
    sinon.restore();
    done();
  });

  it('returns the announcement for the given url', function (done) {
    announcementsAPI.getAnnouncement(announcementUrl, function (err, result) {
      expect(result).to.equal(dummyAnnouncement);
      done();
    });
  });

  it('returns null when url is not existing', function (done) {
    announcementsAPI.getAnnouncement('nichtExistierendeUrl', function (err, result) {
      expect(result).to.be.a('null');
      done();
    });
  });

  it('returns all announcements', function (done) {
    announcementsAPI.allAnnouncements(function (err, result) {
      expect(result).to.have.lengthOf(1);
      done();
    });
  });

  it('rejects urls that are reserved', function (done) {
    expect(announcementsAPI.isReserved('edit')).to.be.true;
    expect(announcementsAPI.isReserved('eDit')).to.be.true;
    expect(announcementsAPI.isReserved('neW')).to.be.true;
    expect(announcementsAPI.isReserved('checkurl')).to.be.true;
    expect(announcementsAPI.isReserved('submIt')).to.be.true;
    announcementsAPI.isValidUrl(' checkurl ', function (err, result) {
      expect(result).to.be.false;
      done();
    });
  });

  it('validates a valid url', function (done) {
    announcementsAPI.isValidUrl('thisIsAValidUrl', function (err, result) {
      expect(result).to.be.true;
      done();
    });
  });

  it('validates a invalid url', function (done) {
    announcementsAPI.isValidUrl('edit', function (err, result) {
      expect(result).to.be.false;
      done();
    });
  });

  it('creates an id out of the fields `author`, `title` and `timeUnix` when saving', function (done) {
    announcementsAPI.saveAnnouncement(dummyAnnouncement, function (err, result) {
      expect(result).to.have.property('id', 'author_title_1372464000');
      done();
    });
  });

  it('converts a German date to unix timestamp when saving', function (done) {
    var object = {
      title: 'title',
      url: announcementUrl,
      text: 'text',
      author: 'author',
      thruDate: '31.12.2013'
    };
    var result = new Announcement(object);
    expect(result.thruUnix).to.equal(1388448000);
    done();
  });

  it('displays member\'s nickname as author name', function (done) {
    var dummyMember = {nickname: "nickname", id: "member ID"};
    sinon.stub(membersAPI, 'getMemberForId', function (id, callback) {
      callback(null, dummyMember);
    });
    announcementsAPI.getAuthorName(dummyAnnouncement, function (err, name) {
      expect(name).to.equal('nickname');
      done(err);
    });
  });

  it('displays "automatisch" as author name when the authorname is empty', function (done) {
    dummyAnnouncement.author = '';
    announcementsAPI.getAuthorName(dummyAnnouncement, function (err, name) {
      expect(name).to.equal('automatisch');
      done(err);
    });
  });

  it('displays "automatisch" as author name when there is no author', function (done) {
    dummyAnnouncement.author = null;
    announcementsAPI.getAuthorName(dummyAnnouncement, function (err, name) {
      expect(name).to.equal('automatisch');
      done(err);
    });
  });

});
