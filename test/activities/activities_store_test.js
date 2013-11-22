"use strict";

var expect = require('chai').expect;
var sinon = require('sinon');
var sinonSandbox = sinon.sandbox.create();

var conf = require('../configureForTest');
var persistence = conf.get('beans').get('activitiesPersistence');
var store = conf.get('beans').get('activitystore');

describe('Activity store', function () {
  var activity1 = {title: 'CodingDojo1', url: 'CodingDojo1', description: 'bli'};
  var activity2 = {title: 'CodingDojo2', url: 'CodingDojo2', description: 'bla'};
  var sampleList = [activity1, activity2];
  var getByField;
  var getById;

  before(function (done) {
    var list = sinonSandbox.stub(persistence, 'list');
    list.callsArgWith(1, null, sampleList);
    getByField = sinonSandbox.stub(persistence, 'getByField');
    getByField.callsArgWith(1, null, activity1);
    getById = sinonSandbox.stub(persistence, 'getById');
    getById.callsArgWith(1, null, activity1);
    done();
  });

  after(function (done) {
    sinonSandbox.restore();
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

});
