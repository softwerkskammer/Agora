'use strict';

const expect = require('must-dist');

const async = require('async');
require('./../../testutil/configureForTest');

function createTeststore(collectionName) {
  return require('../../lib/persistence/persistence')(collectionName);
}

describe('The parallel persistence store', () => {
  const persistence1 = createTeststore('teststore1');
  const persistence2 = createTeststore('teststore2');

  it('retrieves in parallel', done => {
    async.parallel([
      callback => {
        persistence1.save({id: 'toPersist', name: 'Heinz'}, () => {
          persistence1.getById('toPersist', (err, result) => {
            expect(result.id).to.equal('toPersist');
            expect(result.name).to.equal('Heinz');
            callback(err);
          });
        });
      },
      callback => {
        persistence2.save({id: 'toStore', name: 'Hans'}, () => {
          persistence2.getById('toStore', (err, result) => {
            expect(result.id).to.equal('toStore');
            expect(result.name).to.equal('Hans');
            callback(err);
          });
        });
      },
      callback => {
        persistence1.save({id: 'toPersist2', name: 'Heinz2'}, () => {
          persistence1.getById('toPersist2', (err, result) => {
            expect(result.id).to.equal('toPersist2');
            expect(result.name).to.equal('Heinz2');
            callback(err);
          });
        });
      },
      callback => {
        persistence2.save({id: 'toStore2', name: 'Hans2'}, () => {
          persistence2.getById('toStore2', (err, result) => {
            expect(result.id).to.equal('toStore2');
            expect(result.name).to.equal('Hans2');
            callback(err);
          });
        });
      }
    ], done);
  });

});

