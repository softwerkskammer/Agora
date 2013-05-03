"use strict";

var expect = require('chai').expect;
var sinon = require('sinon');
var conf = require('../configureForTest');

var Activity = conf.get('beans').get('activity');

var activityId = 'UGMUC_CodingDojo_01.04.2015';
var dummyActivity = new Activity({id: activityId, url: 'url', title: 'CodingDojo', assignedGroup: 'UGMUC', location: 'Munich'});

var store = conf.get('beans').get('activitystore');

var api = conf.get('beans').get('activitystore');

describe('Activities API', function () {

  beforeEach(function (done) {
    sinon.stub(store, 'getActivity', function (id, callback) {
      if (id === activityId) {
        return callback(null, dummyActivity);
      }
      callback(null, null);
    });
    sinon.stub(store, 'allActivities', function (callback) {callback(null, [dummyActivity]); });
    done();
  });

  afterEach(function (done) {
    store.getActivity.restore();
    store.allActivities.restore();
    done();
  });

  it('returns the activity for the given id', function (done) {
    api.getActivity(activityId, function (err, result) {
      expect(result).to.equal(dummyActivity);
      done();
    });
  });

  it('returns null when id is not existing', function (done) {
    api.getActivity(1234, function (err, result) {
      expect(result).to.be.a('null');
      done();
    });
  });

  it('returns all activites', function (done) {
    api.allActivities(function (err, result) {
      expect(result).to.have.lengthOf(1);
      done();
    });
  });

});
