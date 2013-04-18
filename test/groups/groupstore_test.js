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

var store = proxyquire('../../lib/groups/groupstore.js', {'../persistence/persistence': function () {
  return persistenceStub;
}});

describe('Groups store', function () {
  var sampleGroup = {id: 'groupA'};
  var getById = sinon.stub(persistenceStub, 'getById');
  getById.callsArgWith(1, null, sampleGroup);

  it('retrieves groupnames given the intended case', function (done) {
    var queriedId = 'groupA';
    store().getGroup(queriedId, function (err, group) {
      group.id.should.equal(sampleGroup.id);
      getById.calledWith(new RegExp('^' + queriedId + '$', 'i')).should.be.true;
      done(err);
    });
  });

  it('retrieves groupnames given a different case', function (done) {
    var queriedId = 'GRouPA';
    store().getGroup(queriedId, function (err, group) {
      group.id.should.equal(sampleGroup.id);
      getById.calledWith(new RegExp('^' + queriedId + '$', 'i')).should.be.true;
      done(err);
    });
  });


});
