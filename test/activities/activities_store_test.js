"use strict";

var expect = require('chai').expect;
var sinon = require('sinon').sandbox.create();

var conf = require('../configureForTest');
var persistence = conf.get('beans').get('activitiesPersistence');
var store = conf.get('beans').get('activitystore');

describe('Activity store', function () {
  var activity1 = {title: 'CodingDojo1', url: 'CodingDojo1', description: 'bli'};
  var activity2 = {title: 'CodingDojo2', url: 'CodingDojo2', description: 'bla'};
  var sampleList = [activity1, activity2];
  var getByField;
  var getById;
  var list;

  beforeEach(function (done) {
    list = sinon.stub(persistence, 'list', function (sortOrder, callback) {
      return callback(null, sampleList);
    });
    getByField = sinon.stub(persistence, 'getByField', function (object, callback) {
      return callback(null, activity1);
    });
    getById = sinon.stub(persistence, 'getById', function (object, callback) {
      return callback(null, activity1);
    });
    done();
  });

  afterEach(function (done) {
    sinon.restore();
    done();
  });

  it('calls persistence.list for store.allActivities and transforms the result to an Activity', function (done) {
    store.allActivities(function (err, activities) {
      expect(activities[0].title()).to.equal(activity1.title);
      expect(activities[1].title()).to.equal(activity2.title);
      expect(activities[0].descriptionHTML()).to.contain('bli');
      expect(activities[1].descriptionHTML()).to.contain('bla');
      done(err);
    });
  });

  it('calls persistence.getByField for store.getActivity and transforms the result to an Activity', function (done) {
    var url = activity1.url;
    store.getActivity(url, function (err, activity) {
      expect(activity.title()).to.equal(activity1.title);
      expect(getByField.calledWith({url: url})).to.be.true;
      expect(activity.descriptionHTML()).to.contain('bli');
      done(err);
    });
  });

  it('calls persistence.getById for store.getActivityForId and transforms the result to an Activity', function (done) {
    var id = 'id';
    store.getActivityForId(id, function (err, activity) {
      expect(activity.title()).to.equal(activity1.title);
      expect(getById.calledWith(id)).to.be.true;
      expect(activity.descriptionHTML()).to.contain('bli');
      done(err);
    });
  });

  it('returns an activity object for the given id although the persistence only returns a JS object', function (done) {
    getByField.restore();
    sinon.stub(persistence, 'getByField', function (id, callback) {
      return callback(null, {url: "activityUrl"});
    });

    store.getActivity("activityUrl", function (err, result) {
      expect(result.url()).to.equal("activityUrl");
      done();
    });
  });

  it('returns null when id does not exist', function (done) {
    getByField.restore();
    sinon.stub(persistence, 'getByField', function (id, callback) {
      callback();
    });

    store.getActivity(1234, function (err, result) {
      expect(result).to.be.a('null');
      done();
    });
  });

  it('returns undefined when persistence yields an error', function (done) {
    getByField.restore();
    sinon.stub(persistence, 'getByField', function (id, callback) {
      callback(new Error("error"));
    });

    store.getActivity(1234, function (err, result) {
      expect(!!err).to.be.true;
      expect(result).to.be.undefined;
      done();
    });
  });

  it('returns all activites although the persistence only returns JS objects', function (done) {
    list.restore();
    sinon.stub(persistence, 'list', function (sortOrder, callback) {
      callback(null, [
        {url: "activityUrl"}
      ]);
    });

    store.allActivities(function (err, result) {
      expect(result).to.have.lengthOf(1);
      expect(result[0].url()).to.equal("activityUrl");
      done();
    });
  });


});
