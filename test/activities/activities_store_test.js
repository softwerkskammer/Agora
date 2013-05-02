"use strict";

var expect = require('chai').expect;
var sinon = require('sinon');

var conf = require('../configureForTest');
var persistence = conf.get('beans').get('activitiesPersistence');
var store = conf.get('beans').get('activitystore');

describe('Activity store', function () {
  var activity1 = {title: 'CodingDojo1'};
  var activity2 = {title: 'CodingDojo2'};
  var sampleList = [activity1, activity2];

  before(function (done) {
    var list = sinon.stub(persistence, 'list');
    list.callsArgWith(1, null, sampleList);
    done();
  });

  after(function (done) {
    persistence.list.restore();
    done();
  });

  it('calls persistence.list for store.allActivities and passes on the given callback', function (done) {
    store.allActivities(function (err, activities) {
      expect(activities[0].title).to.equal(activity1.title);
      expect(activities[1].title).to.equal(activity2.title);
      done(err);
    });
  });

});
