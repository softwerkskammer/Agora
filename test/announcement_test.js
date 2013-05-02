"use strict";
var request = require('supertest');
var express = require('express');
var sinon = require('sinon');
var proxyquire = require('proxyquire');

require('chai').should();

var Announcement = require('../lib/announcements/announcement');

var dummyAnnouncementEntry = new Announcement('title', 'shortDescription', 'text', 'author', new Date(2011, 12, 31, 11, 59, 59), 'thruDate');

var announcementAPIStub = {
  allAnnouncements: function (callback) {
    callback(null, [dummyAnnouncementEntry]);
  },
  getAnnouncement: function (id, callback) {
    callback(null, dummyAnnouncementEntry);
  }
};

var announcementApp = proxyquire('../lib/announcements', {  './announcementAPI': announcementAPIStub});

var app = announcementApp(express());

describe('Announcement application', function () {

  it('shows the list of announcements as retrieved from the store', function (done) {
    var allAnnouncements = sinon.spy(announcementAPIStub, 'allAnnouncements');

    request(app)
      .get('/')
      .expect(200)
      .expect(/href="title"/)
      .expect(/title/, function (err) {
        allAnnouncements.calledOnce.should.be.ok;
        announcementAPIStub.allAnnouncements.restore();
        done(err);
      });
  });
});
