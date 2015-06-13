'use strict';

var sinon = require('sinon');
var expect = require('must-dist');

var beans = require('../../testutil/configureForTest').get('beans');
var persistence = beans.get('groupsPersistence');
var store = beans.get('groupstore');

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
      expect(getById.calledWith(new RegExp('^' + queriedId + '$', 'i'))).to.be(true);
      done(err);
    });
  });

  it('retrieves groupnames given a different case', function (done) {
    var queriedId = 'GRouPA';
    store.getGroup(queriedId, function (err, group) {
      expect(group.id).to.equal(sampleGroup.id);
      expect(getById.calledWith(new RegExp('^' + queriedId + '$', 'i'))).to.be(true);
      done(err);
    });
  });


});
