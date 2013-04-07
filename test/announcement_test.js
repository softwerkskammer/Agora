/*global describe, it */
"use strict";
var request = require('supertest'),
  express = require('express'),
  sinon = require('sinon'),
  proxyquire = require('proxyquire');

require('chai').should();

var Announcement = require('../lib/announcements/announcement');

var dummyTitle = 'title';
var dummyFromDate = new Date(2011, 12, 31, 11, 59, 59);

var dummyAnnouncementEntry = new Announcement(dummyTitle, 'shortDescription', 'text', 'author', dummyFromDate, 'thruDate');

var announcementAPIStub = {
  allAnnouncements: function (callback) {
    callback(null, [dummyAnnouncementEntry]);
  },
  getAnnouncement: function (id, callback) {
    callback(null, dummyAnnouncementEntry);
  }
};

var announcementApp = proxyquire('../lib/announcements', {
  './announcementAPI'                          : function () {
    return announcementAPIStub;
  }
});

var app = announcementApp(express(), { get: function () {
  return null;
} });   // empty config

describe('Announcement application', function () {

  it('shows the list of announcements as retrieved from the store', function (done) {
    var allAnnouncements = sinon.spy(announcementAPIStub, 'allAnnouncements');

    request(app)
      .get('/')
      .expect(200)
      .expect(/href="54d7c600ee5b3e350642aa9604d5b3c4c3f02a9f"/)
      .expect(/title/, function (err) {
        allAnnouncements.calledOnce.should.be.ok;
        done(err);
      });
  });
});
