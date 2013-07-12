"use strict";

var expect = require('chai').expect;
var sinon = require('sinon');
var conf = require('../configureForTest');
//var moment = require('moment');

var fieldHelpers = conf.get('beans').get('fieldHelpers');
var Announcement = conf.get('beans').get('announcement');

var announcementUrl = 'eineSchoeneUrl';
var dummyAnnouncement = new Announcement({
  title: 'title',
  url: announcementUrl,
  text: 'text',
  author: 'author',
  fromDate: 1372461025223, // 29.06.2013
  thruDate: 'thruDate'
});

//var store = conf.get('beans').get('announcementstore');
var announcementsAPI = conf.get('beans').get('announcementsAPI');

describe('Announcements API', function () {

  beforeEach(function (done) {
    sinon.stub(announcementsAPI, 'getAnnouncement', function (url, callback) {
      callback(null, (url === announcementUrl) ? dummyAnnouncement : null);
    });
    sinon.stub(announcementsAPI, 'allAnnouncements', function (callback) {
      return callback(null, [dummyAnnouncement]);
    });
    sinon.stub(announcementsAPI, 'saveAnnouncement', function (dummyAnnouncement, callback) {
//      dummyAnnouncement.timeUnix = moment(dummyAnnouncement.fromDate, "MM-DD-YYYY").unix();
      dummyAnnouncement.id = fieldHelpers.createLinkFrom([dummyAnnouncement.author, dummyAnnouncement.title, dummyAnnouncement.fromDate]);
      return callback(null, dummyAnnouncement);
    });
    done();
  });

  afterEach(function (done) {
    announcementsAPI.getAnnouncement.restore();
    announcementsAPI.allAnnouncements.restore();
    announcementsAPI.saveAnnouncement.restore();
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

//  it('gets the field `timeUnix` from a German date when saving', function (done) {
//    announcementsAPI.saveAnnouncement(dummyAnnouncement, function (err, result) {
//      expect(result).to.have.property('fromDate', 1372461025223);
//      done();
//    });
//  });

  it('creates an id out of the fields `author`, `title` and `timeUnix` when saving', function (done) {
    announcementsAPI.saveAnnouncement(dummyAnnouncement, function (err, result) {
      expect(result).to.have.property('id', 'author_title_1372461025223');
      done();
    });
  });

});
