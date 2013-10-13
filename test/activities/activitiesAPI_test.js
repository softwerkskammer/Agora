"use strict";

var sinon = require('sinon').sandbox.create();
var expect = require('chai').expect;

var conf = require('../configureForTest');

var Activity = conf.get('beans').get('activity');
var dummyActivity = new Activity().fillFromDB({title: 'Title of the Activity', description: 'description', assignedGroup: 'assignedGroup',
  location: 'location', direction: 'direction', startDate: '01.01.2013', url: 'urlOfTheActivity', color: 'aus Gruppe' });

var activitiesAPI = conf.get('beans').get('activitiesAPI');

var activitiesCoreAPI = conf.get('beans').get('activitiesCoreAPI');
var groupsAPI = conf.get('beans').get('groupsAPI');
var colors = conf.get('beans').get('colorAPI');

describe('Activities API', function () {

  beforeEach(function (done) {
    sinon.stub(activitiesCoreAPI, 'allActivities', function (callback) {callback(null, [dummyActivity]); });

    sinon.stub(groupsAPI, 'getAllAvailableGroups', function (callback) {
      callback(null, [{id: 'assignedGroup', longName: 'The name of the assigned Group'}]);
    });
    sinon.stub(groupsAPI, 'allColors', function (callback) {
      var result = {};
      result['assignedGroup'] = '#123456';
      callback(null, result);
    });
    sinon.stub(colors, 'allColors', function (callback) { callback(null, []); });
    done();
  });

  afterEach(function (done) {
    sinon.restore();
    done();
  });

  it('returns an activity and enhances it with its color and group name', function () {
    activitiesAPI.getActivitiesForDisplay(activitiesCoreAPI.allActivities, function (err, activities) {
      expect(!!err).to.be.false;
      expect(activities.length).to.equal(1);
      var activity = activities[0];
      expect(activity.title).to.equal('Title of the Activity');
      expect(activity.colorRGB).to.equal('#123456');
      expect(activity.groupName).to.equal('The name of the assigned Group');
    });
  });
});