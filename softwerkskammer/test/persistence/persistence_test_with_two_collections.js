'use strict';

var expect = require('must-dist');

var async = require('async');
require('./../../testutil/configureForTest');

var createTeststore = function (collectionName) {
  return require('../../lib/persistence/persistence')(collectionName);
};

describe('The parallel persistence store', function () {
  var persistence1 = createTeststore('teststore1');
  var persistence2 = createTeststore('teststore2');

  it('retrieves in parallel', function (done) {
    async.parallel([
      function (callback) {
        persistence1.save({id: 'toPersist', name: 'Heinz'}, function () {
          persistence1.getById('toPersist', function (err, result) {
            expect(result.id).to.equal('toPersist');
            expect(result.name).to.equal('Heinz');
            callback(err);
          });
        });
      },
      function (callback) {
        persistence2.save({id: 'toStore', name: 'Hans'}, function () {
          persistence2.getById('toStore', function (err, result) {
            expect(result.id).to.equal('toStore');
            expect(result.name).to.equal('Hans');
            callback(err);
          });
        });
      },
      function (callback) {
        persistence1.save({id: 'toPersist2', name: 'Heinz2'}, function () {
          persistence1.getById('toPersist2', function (err, result) {
            expect(result.id).to.equal('toPersist2');
            expect(result.name).to.equal('Heinz2');
            callback(err);
          });
        });
      },
      function (callback) {
        persistence2.save({id: 'toStore2', name: 'Hans2'}, function () {
          persistence2.getById('toStore2', function (err, result) {
            expect(result.id).to.equal('toStore2');
            expect(result.name).to.equal('Hans2');
            callback(err);
          });
        });
      }
    ], done);
  });

});

