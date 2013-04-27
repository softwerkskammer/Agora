/*global describe, it */
"use strict";
var request = require('supertest');
var express = require('express');
var sinon = require('sinon');
var proxyquire = require('proxyquire');

require('chai').should();

var Activity = require('../../lib/activities/activity');

var dummyActivity = new Activity(
  {title: 'title',
    description: 'description',
    assignedGroup: 'assignedGroup',
    location: 'location',
    direction: 'direction',
    activityDate: 'activityDate',
    startTime: 'startTime'
  });

var activitiesAPIStub = {
  getActivityForId: function (id, callback) {
    var activity;
    var err = null;

    if (id === 'assignedGroup_title_activityDate') {
      activity = dummyActivity;
    } else {
      activity = null;
    }
    callback(err, activity);
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

describe('Activity application', function () {

  it('object is not valid, if the required fields are not filled', function () {
    var tmpActivity = new Activity(
      {description: 'description',
        assignedGroup: 'assignedGroup',
        location: 'location',
        direction: 'direction',
        activityDate: '2012-11-11',
        startTime: 'startTime'
      });
    tmpActivity.isValid().should.equal.false;
  });

  it('shows the list of activities as retrieved from the store', function (done) {
    var allActivities = sinon.spy(activitiesAPIStub, 'allActivities');

    request(app)
      .get('/')
      .expect(200)
      .expect(/Aktivitäten/)
      .expect(/href="assignedGroup_title_activityDate"/)
      .expect(/title/, function (err) {
        allActivities.calledOnce.should.be.ok;
        activitiesAPIStub.allActivities.restore();
        done(err);
      });

    //    activitiesAPIStub.allActivities.restore();
  });

  it('shows the details of one activity as retrieved from the store', function (done) {
    var getActivityForId = sinon.spy(activitiesAPIStub, 'getActivityForId');
    var id = 'assignedGroup_title_activityDate';

    request(app)
      .get('/' + id)
      .expect(200)
      .expect(/<small> Aktivität/)
      .expect(/<h2>title/, function (err) {
        getActivityForId.calledWith(id).should.be.true;
        activitiesAPIStub.getActivityForId.restore();
        done(err);
      });
  });

  it('shows the list of activities if the id cannot be found in the store for the detail page', function (done) {
    var link = dummyActivity.id + '4711';

    request(app)
      .get('/' + link)
      .expect(302)
      .expect(/activities/, function (err) {
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
