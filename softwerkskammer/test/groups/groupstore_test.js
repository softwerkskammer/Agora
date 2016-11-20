'use strict';

const sinon = require('sinon');
const expect = require('must-dist');

const beans = require('../../testutil/configureForTest').get('beans');
const persistence = beans.get('groupsPersistence');
const store = beans.get('groupstore');

describe('Groups store', () => {

  const sampleGroup = {id: 'groupa'};
  let getById;

  before(() => {
    getById = sinon.stub(persistence, 'getById');
    getById.callsArgWith(1, null, sampleGroup);
  });

  after(() => {
    persistence.getById.restore();
  });

  it('retrieves groupnames given the intended case', done => {
    const queriedId = 'groupA';
    store.getGroup(queriedId, (err, group) => {
      expect(group.id).to.equal(sampleGroup.id);
      expect(getById.calledWith(new RegExp('^' + queriedId + '$', 'i'))).to.be(true);
      done(err);
    });
  });

  it('retrieves groupnames given a different case', done => {
    const queriedId = 'GRouPA';
    store.getGroup(queriedId, (err, group) => {
      expect(group.id).to.equal(sampleGroup.id);
      expect(getById.calledWith(new RegExp('^' + queriedId + '$', 'i'))).to.be(true);
      done(err);
    });
  });

});
