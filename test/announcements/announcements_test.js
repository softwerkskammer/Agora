/*global describe, it */
"use strict";
var conf = require('../configureForTest');

var request = require('supertest');
var sinonSandbox = require('sinon').sandbox.create();
var expect = require('chai').expect;
var moment = require('moment-timezone');

var beans = conf.get('beans');
var Announcement = beans.get('announcement');

var dummyAnnouncement = new Announcement({
  title: 'title',
  url: 'url',
  message: 'text',
  author: 'author',
  fromUnix: 1375056000, // 29.07.2013
  thruUnix: 1388448000 // 31.12.2013
});

var announcementsAPI = beans.get('announcementsAPI');
var membersAPI = beans.get('membersAPI');
var validation = beans.get('validation');

var app = require('../testHelper')('announcementsApp').createApp();

describe('Announcement application', function () {
  var allAnnouncements;
  var allAnnouncementsUntilToday;
  var getAnnouncement;

  beforeEach(function (done) {
    allAnnouncements = sinonSandbox.stub(announcementsAPI, 'allAnnouncements', function (callback) {
      return callback(null, [dummyAnnouncement]);
    });
    allAnnouncementsUntilToday = sinonSandbox.stub(announcementsAPI, 'allAnnouncementsUntilToday', function (callback) {
      return callback(null, [dummyAnnouncement]);
    });
    getAnnouncement = sinonSandbox.stub(announcementsAPI, 'getAnnouncement', function (url, callback) {
      callback(null, (url === 'url') ? dummyAnnouncement : null);
    });
    done();
  });

  afterEach(function (done) {
    sinonSandbox.restore();
    done();
  });

  it('object is not valid, if the required fields are not filled', function () {
    var tmpAnnouncement = new Announcement({
      title: 'title',
      url: 'url'
      // Other fields are missing
    });
    expect(validation.isValidAnnouncement(tmpAnnouncement)).to.equal.false;
  });

  it('shows the list of announcements as retrieved from the store', function (done) {
    request(app)
      .get('/')
      .expect(200)
      .expect(/Nachrichten/)
      .expect(/href="url"/)
      .expect(/title/, function (err) {
        expect(allAnnouncementsUntilToday.calledOnce).to.be.ok;
        done(err);
      });
  });

  it('shows the details of one announcement as retrieved from the store', function (done) {
    var dummyMember = {nickname: "nickname", id: "member ID"};
    sinonSandbox.stub(membersAPI, 'getMemberForId', function (id, callback) {
      callback(null, dummyMember);
    });
    var url = 'url';

    request(app)
      .get('/' + url)
      .expect(200)
      .expect(/<small>29.07.2013/)
      .expect(/<h2>title/, function (err) {
        expect(getAnnouncement.calledWith(url)).to.be.true;
        done(err);
      });
  });

  it('shows a thruDate when editing an announcement having a thruDate', function (done) {
    dummyAnnouncement.id = 1234;
    var url = 'url';

    request(app)
      .get('/edit/' + url)
      .expect(200)
      .expect(/<input id="thruDate" type="text" name="thruDate" value="31.12.2013"/)
      .expect(/<legend>Nachricht bearbeiten/, function (err) {
        expect(getAnnouncement.calledWith(url)).to.be.true;
        done(err);
      });
  });

  //  it('shows a 404 if the url cannot be found in the store for the detail page', function (done) {
  //    var link = dummyAnnouncement.url + '-does-not-exist';
  //    console.log(link);
  //
  //    request(app)
  //        .get('/' + link)
  //        .expect(404, function (err) {
  //          done(err);
  //        });
  //  });

  it('allows to create a new announcement', function (done) {
    request(app)
      .get('/new')
      .expect(200)
      .expect(/announcements/, function (err) {
        done(err);
      });
  });

  it('keeps a unix timestamp, if thruDate is already a unix timestamp', function () {
    var dummyAnnouncement = new Announcement({
      title: 'title',
      url: 'url',
      message: 'text',
      author: 'author',
      fromUnix: 1388448000,
      thruUnix: 1388448000
    });
    expect(dummyAnnouncement.thruUnix).to.equal(1388448000);
  });

  it('sets fromDate to current timestamp, when a new Announcement gets created', function () {
    var dummyAnnouncement = new Announcement();
    var now = moment.utc().unix();
    expect(dummyAnnouncement.fromUnix).to.equal(now);
  });

});
