/*global describe, it */
"use strict";
var request = require('supertest'),
  express = require('express'),
  sinon = require('sinon'),
  proxyquire = require('proxyquire');

require('chai').should();

var Activity = require('../lib/activities/activity');

var dummyActivity = new Activity('id', 'title', 'description', 'assignedGroup', 'location', 'direction', 'activityDate', 'startTime');

var activitiesAPIStub = {
  getActivity: function (id, callback) {
    callback(null, dummyActivity);
  },
  allActivities: function (callback) {
    console.log('callback: ', callback);

    callback(null, [dummyActivity]);
  }
};

var activityApp = proxyquire('../lib/activities', {
  './activitiesAPI': function () {
    return activitiesAPIStub;
  }
});

var app = activityApp(express(), { get: function () {
  return null;
} });   // empty config


describe('Activity application', function () {

  it('shows the list of activities as retrieved from the store', function (done) {
    var allActivities = sinon.spy(activitiesAPIStub, 'allActivities');

    request(app)
      .get('/')
      .expect(200)
      .expect(/Aktivitäten/)
      .expect(/href="id"/)
      .expect(/title/, function (err) {
        allActivities.calledOnce.should.be.ok;
        done(err);
      });
  });
});