/*global describe, it */
"use strict";
var conf = require('../configureForTest');

var request = require('supertest'),
    express = require('express'),
    sinon = require('sinon'),
    expect = require('chai').expect;

var Announcement = conf.get('beans').get('announcement');
var dummyAnnouncement = new Announcement({
  title: 'title',
  url: 'url',
  text: 'text',
  author: 'author',
  fromDate: '31.01.2012',
  thruDate: 'thruDate'
});

var announcementsAPI = conf.get('beans').get('announcementsAPI');
var validation = conf.get('beans').get('validation');

var app = conf.get('beans').get('announcementsApp')(express());

describe('Announcement application', function () {
  var allAnnouncements;
  var getAnnouncement;

  beforeEach(function (done) {
    allAnnouncements = sinon.stub(announcementsAPI, 'allAnnouncements', function (callback) {return callback(null, [dummyAnnouncement]); });
    getAnnouncement = sinon.stub(announcementsAPI, 'getAnnouncement', function (url, callback) {callback(null, (url === 'url') ? dummyAnnouncement : null); });
    done();
  });

  afterEach(function (done) {
    announcementsAPI.allAnnouncements.restore();
    announcementsAPI.getAnnouncement.restore();
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
          expect(allAnnouncements.calledOnce).to.be.ok;
          done(err);
        });
  });

  it('shows the details of one announcement as retrieved from the store', function (done) {
    var url = 'url';

    request(app)
        .get('/' + url)
        .expect(200)
        .expect(/&nbsp;<small>31.01.2012/)
        .expect(/<h2>title/, function (err) {
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

  it('gets the field `timeUnix` from a German date', function (done) {
    expect(dummyAnnouncement.getTimeUnix()).to.equal(1404165600);
    done();
  });

});
