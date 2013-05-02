/*global describe, it */
"use strict";
var request = require('supertest'),
    express = require('express'),
    sinon = require('sinon'),
    proxyquire = require('proxyquire');

require('chai').should();

var validation = require('../../lib/commons/validation');
var Announcement = require('../../lib/announcements/announcement');

var dummyAnnouncement = new Announcement({
  title: 'title',
  url: 'url',
  shortDescription: 'shortDescription',
  text: 'text',
  author: 'author',
  fromDate: new Date(2011, 12, 31, 11, 59, 59),
  thruDate: 'thruDate'
});

var announcementAPIStub = {
  allAnnouncements: function (callback) {
    callback(null, [dummyAnnouncement]);
  },
  getAnnouncement: function (url, callback) {
    callback(null, dummyAnnouncement);
  }
};

var announcementApp = proxyquire('../../lib/announcements', {  './announcementAPI': announcementAPIStub});

var app = announcementApp(express());

describe('Announcement application', function () {

  it('object is not valid, if the required fields are not filled', function () {
    var tmpAnnouncement = new Announcement({
      title: 'title',
      url: 'url'
      // Other fields are missing
    });
    validation.isValidAnnouncement(tmpAnnouncement).should.equal.false;
  });

  it('shows the list of announcements as retrieved from the store', function (done) {
    var allAnnouncements = sinon.spy(announcementAPIStub, 'allAnnouncements');

    request(app)
        .get('/')
        .expect(200)
        .expect(/Nachrichten/)
        .expect(/href="url"/)
        .expect(/title/, function (err) {
          allAnnouncements.calledOnce.should.be.ok;
          announcementAPIStub.allAnnouncements.restore();
          done(err);
        });
  });

  it('shows the details of one announcement as retrieved from the store', function (done) {
    var getAnnouncement = sinon.spy(announcementAPIStub, 'getAnnouncement');
    var url = 'url';

    request(app)
        .get('/' + url)
        .expect(200)
        .expect(/<small> 31.01.2012/)
        .expect(/<h2>title/, function (err) {
          getAnnouncement.calledWith(url).should.be.true;
          announcementAPIStub.getAnnouncement.restore();
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

  it('allows to create a new activity', function (done) {

    request(app)
        .get('/new')
        .expect(200)
        .expect(/announcements/, function (err) {
          done(err);
        });
  });

});
