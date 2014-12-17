'use strict';

var expect = require('must');
var sinon = require('sinon').sandbox.create();

var beans = require('../../testutil/configureForTest').get('beans');
var persistence = beans.get('activitiesPersistence');
var store = beans.get('activitystore');
var Activity = beans.get('activity');

describe('Activity store', function () {
  var activity1 = {title: 'CodingDojo1', url: 'CodingDojo1', description: 'bli'};
  var activity2 = {title: 'CodingDojo2', url: 'CodingDojo2', description: 'bla'};
  var sampleList = [activity1, activity2];
  var getByField;
  var getById;
  var list;

  beforeEach(function () {
    list = sinon.stub(persistence, 'list', function (sortOrder, callback) {
      return callback(null, sampleList);
    });
    sinon.stub(persistence, 'listByField', function (searchObject, sortOrder, callback) {
      return callback(null, sampleList);
    });
    getByField = sinon.stub(persistence, 'getByField', function (object, callback) {
      return callback(null, activity1);
    });
    getById = sinon.stub(persistence, 'getById', function (object, callback) {
      return callback(null, activity1);
    });
  });

  afterEach(function () {
    sinon.restore();
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
      expect(getByField.calledWith({url: url})).to.be(true);
      expect(activity.descriptionHTML()).to.contain('bli');
      done(err);
    });
  });

  it('calls persistence.getById for store.getActivityForId and transforms the result to an Activity', function (done) {
    var id = 'id';
    store.getActivityForId(id, function (err, activity) {
      expect(activity.title()).to.equal(activity1.title);
      expect(getById.calledWith(id)).to.be(true);
      expect(activity.descriptionHTML()).to.contain('bli');
      done(err);
    });
  });

  it('returns an activity object for the given id although the persistence only returns a JS object', function (done) {
    getByField.restore();
    sinon.stub(persistence, 'getByField', function (id, callback) { return callback(null, {url: 'activityUrl'}); });

    store.getActivity('activityUrl', function (err, result) {
      expect(result.url()).to.equal('activityUrl');
      done(err);
    });
  });

  it('returns null when id does not exist', function (done) {
    getByField.restore();
    sinon.stub(persistence, 'getByField', function (id, callback) { callback(); });

    store.getActivity(1234, function (err, result) {
      expect(result).to.be(null);
      done(err);
    });
  });

  it('returns undefined when persistence yields an error', function (done) {
    getByField.restore();
    sinon.stub(persistence, 'getByField', function (id, callback) { callback(new Error('error')); });

    store.getActivity(1234, function (err, result) {
      expect(err).to.exist();
      expect(result).to.not.exist();
      done(); // error condition - do not pass err
    });
  });

  it('returns all activites although the persistence only returns JS objects', function (done) {
    list.restore();
    sinon.stub(persistence, 'list', function (sortOrder, callback) { callback(null, [ {url: 'activityUrl'} ]); });

    store.allActivities(function (err, result) {
      expect(result).to.have.length(1);
      expect(result[0].url()).to.equal('activityUrl');
      done(err);
    });
  });

  it('returns upcoming activities', function (done) {
    store.upcomingActivities(function (err, result) {
      expect(result).to.have.length(2);
      done(err);
    });
  });

  it('returns past activities', function (done) {
    store.pastActivities(function (err, result) {
      expect(result).to.have.length(2);
      done(err);
    });
  });

  it('calls persistence.remove for store.removeActivity and passes on the given callback', function (done) {
    var remove = sinon.stub(persistence, 'remove', function (memberId, callback) { callback(); });
    var activity = new Activity(activity1);
    activity.state.id = 'I D';
    store.removeActivity(activity, function (err) {
      expect(remove.calledWith('I D')).to.be(true);
      done(err);
    });
  });


});
