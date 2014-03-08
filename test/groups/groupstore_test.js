"use strict";

var conf = require('../../testutil/configureForTest');
var sinon = require('sinon');
var expect = require('chai').expect;

var persistence = conf.get('beans').get('groupsPersistence');

var store = conf.get('beans').get('groupstore');

describe('Groups store', function () {

  var sampleGroup = {id: 'groupa'};
  var getById;

  before(function () {
    getById = sinon.stub(persistence, 'getById');
    getById.callsArgWith(1, null, sampleGroup);
  });

  after(function () {
    persistence.getById.restore();
  });

  it('retrieves groupnames given the intended case', function (done) {
    var queriedId = 'groupA';
    store.getGroup(queriedId, function (err, group) {
      expect(group.id).to.equal(sampleGroup.id);
      expect(getById.calledWith(new RegExp('^' + queriedId + '$', 'i'))).to.be.true;
      done(err);
    });
  });

  it('retrieves groupnames given a different case', function (done) {
    var queriedId = 'GRouPA';
    store.getGroup(queriedId, function (err, group) {
      expect(group.id).to.equal(sampleGroup.id);
      expect(getById.calledWith(new RegExp('^' + queriedId + '$', 'i'))).to.be.true;
      done(err);
    });
  });


});
