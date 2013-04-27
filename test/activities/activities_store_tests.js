/*global describe, it */
"use strict";
require('chai').should();

var proxyquire = require('proxyquire'),
  sinon = require('sinon');

var persistenceStub = {
  save: function () {
  },
  getById: function () {
  },
  getByField: function () {
  },
  list: function () {
  }
};

var store = proxyquire('../../lib/activities/activitystore.js', {'../persistence/persistence': function () {
  return persistenceStub;
}});

describe('Activity store', function () {
  var activity1 = {title: 'CodingDojo1', location: 'Munich', startDate: new Date(2013, 5, 1)};
  var activity2 = {title: 'CodingDojo2', location: 'Frankfurt', startDate: new Date(2013, 5, 2)};
  var sampleList = [activity1, activity2];
  var getByField = sinon.stub(persistenceStub, 'getByField');
  getByField.callsArgWith(1, null, activity1);

  it('calls persistence.list for store.allActivities and passes on the given callback', function (done) {
    var list = sinon.stub(persistenceStub, 'list');
    list.callsArgWith(1, null, sampleList);

    store.allActivities(function (err, activities) {
      activities[0].title.should.equal(activity1.title);
      activities[1].title.should.equal(activity2.title);
      done(err);
    });
  });

});
