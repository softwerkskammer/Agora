"use strict";

var request = require('supertest');
var express = require('express');
var sinon = require('sinon');
var expect = require('chai').expect;

var conf = require('../configureForTest');

var Activity = conf.get('beans').get('activity');
var dummyActivity = new Activity({title: 'title', description: 'description', assignedGroup: 'assignedGroup',
  location: 'location', direction: 'direction', startDate: 'startDate', startTime: 'startTime', url: 'url'});

var activitiesAPI = conf.get('beans').get('activitiesAPI');
var groupsAPI = conf.get('beans').get('groupsAPI');
var validation = conf.get('beans').get('validation');
var colors = conf.get('beans').get('colorAPI');

var app = conf.get('beans').get('activitiesApp')(express());

describe('Activity application', function () {
  var allActivities;
  var getActivity;

  beforeEach(function (done) {
    allActivities = sinon.stub(activitiesAPI, 'allActivities', function (callback) {callback(null, [dummyActivity]); });
    getActivity = sinon.stub(activitiesAPI, 'getActivity', function (url, callback) {callback(null, (url === 'url') ? dummyActivity : null); });
    sinon.stub(groupsAPI, 'getAllAvailableGroups', function (callback) { callback(null, []); });
    sinon.stub(colors, 'allColors', function (callback) { callback(null, []); });
    done();
  });

  afterEach(function (done) {
    activitiesAPI.allActivities.restore();
    activitiesAPI.getActivity.restore();
    groupsAPI.getAllAvailableGroups.restore();
    colors.allColors.restore();
    done();
  });

  it('object is not valid, if the title is not filled', function () {
    var tmpActivity = new Activity({description: 'description', url: 'url', assignedGroup: 'assignedGroup', location: 'location',
      direction: 'direction', startDate: '2012-11-11', startTime: 'startTime' });
    expect(validation.isValidActivity(tmpActivity)).to.equal.false;
  });

  it('shows the list of activities as retrieved from the store', function (done) {
    request(app)
      .get('/')
      .expect(200)
      .expect(/Aktivitäten/)
      .expect(/href="url"/)
      .expect(/title/, function (err) {
        expect(allActivities.calledOnce).to.be.ok;
        done(err);
      });
  });

  it('shows the details of one activity as retrieved from the store', function (done) {
    var url = 'url';

    request(app)
      .get('/' + url)
      .expect(200)
      .expect(/<small>startDate/)
      .expect(/<h2>title/, function (err) {
        expect(getActivity.calledWith(url)).to.be.true;
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
