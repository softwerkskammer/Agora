/*global describe, it, before, after */
"use strict";
var conf = require('../configureForTest');
var sinon = require('sinon');
require('chai').should();

var persistence = conf.get('beans').get('groupsPersistence');

var store = conf.get('beans').get('groupstore');

describe('Groups store', function () {

  var sampleGroup = {id: 'groupA'};
  var getById;

  before(function (done) {
    getById = sinon.stub(persistence, 'getById');
    getById.callsArgWith(1, null, sampleGroup);
    done();
  });

  after(function (done) {
    persistence.getById.restore();
    done();
  });

  it('retrieves groupnames given the intended case', function (done) {
    var queriedId = 'groupA';
    store.getGroup(queriedId, function (err, group) {
      group.id.should.equal(sampleGroup.id);
      getById.calledWith(new RegExp('^' + queriedId + '$', 'i')).should.be.true;
      done(err);
    });
  });

  it('retrieves groupnames given a different case', function (done) {
    var queriedId = 'GRouPA';
    store.getGroup(queriedId, function (err, group) {
      group.id.should.equal(sampleGroup.id);
      getById.calledWith(new RegExp('^' + queriedId + '$', 'i')).should.be.true;
      done(err);
    });
  });


});
