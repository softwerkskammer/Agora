/*global describe, it */
"use strict";
var request = require('supertest');
var express = require('express');
var sinon = require('sinon');
var proxyquire = require('proxyquire');
require('../configureForTest');

require('chai').should();

var Activity = require('../../lib/activities/activity');

var dummyActivity = new Activity(
  {title: 'title',
    description: 'description',
    assignedGroup: 'assignedGroup',
    location: 'location',
    direction: 'direction',
    startDate: 'startDate',
    startTime: 'startTime',
    url: 'url'
  });

var activitiesAPIStub = {
  getActivity: function (url, callback) {
    callback(null, (url === 'url') ? dummyActivity : null);
  },
  allActivities: function (callback) {
    callback(null, [dummyActivity]);
  }
};

var groupsAPIStub = {
  getAllAvailableGroups: function (callback) { callback(null, []); }
};

var activityApp = proxyquire('../../lib/activities', {
  './activitiesAPI': activitiesAPIStub,
  '../groups/groupsAPI': groupsAPIStub
});

var app = activityApp(express());

var validation = require('../../lib/commons/validation');

describe('Activity application', function () {

  it('object is not valid, if the required fields are not filled', function () {
    var tmpActivity = new Activity(
      {description: 'description',
        assignedGroup: 'assignedGroup',
        location: 'location',
        direction: 'direction',
        startDate: '2012-11-11',
        startTime: 'startTime'
      });
    validation.isValidActivity(tmpActivity).should.equal.false;
  });

  it('shows the list of activities as retrieved from the store', function (done) {
    var allActivities = sinon.spy(activitiesAPIStub, 'allActivities');

    request(app)
      .get('/')
      .expect(200)
      .expect(/Aktivitäten/)
      .expect(/href="url"/)
      .expect(/title/, function (err) {
        allActivities.calledOnce.should.be.ok;
        activitiesAPIStub.allActivities.restore();
        done(err);
      });

    //    activitiesAPIStub.allActivities.restore();
  });

  it('shows the details of one activity as retrieved from the store', function (done) {
    var getActivity = sinon.spy(activitiesAPIStub, 'getActivity');
    var url = 'url';

    request(app)
      .get('/' + url)
      .expect(200)
      .expect(/<small>startDate/)
      .expect(/<h2>title/, function (err) {
        getActivity.calledWith(url).should.be.true;
        activitiesAPIStub.getActivity.restore();
        done(err);
      });
  });

  it('shows a 404 if the id cannot be found in the store for the detail page', function (done) {
    var link = dummyActivity.id + '4711';

    request(app)
      .get('/' + link)
      .expect(404, function (err) {
        done(err);
      });
  });

  it('allows to create a new activity', function (done) {

    request(app)
      .get('/new')
      .expect(200)
      .expect(/activities/, function (err) {
        done(err);
      });
  });

});
