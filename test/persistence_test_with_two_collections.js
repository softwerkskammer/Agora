/*global describe, it, beforeEach */
"use strict";

require('chai').should();

var async = require('async'),
  MongoConf = require('./mongoConf'),
  conf = new MongoConf();

var createTeststore = function (collectionName) {
  return require('../lib/persistence/persistence')(collectionName, conf);
};

describe('The parallel persistence store', function () {
  var persistence1;
  var persistence2;

  beforeEach(function (done) {
    persistence1 = createTeststore('teststore1');
    persistence2 = createTeststore('teststore2');
    done();
  });

  it('retrieves in parallel', function (done) {
    async.parallel([
      function (callback) {
        persistence1.save({id: 'toPersist', name: 'Heinz'}, function () {
          persistence1.getById('toPersist', function (err, result) {
            result.id.should.equal('toPersist');
            result.name.should.equal('Heinz');
            callback();
          });
        });
      },
      function (callback) {
        persistence2.save({id: 'toStore', name: 'Hans'}, function () {
          persistence2.getById('toStore', function (err, result) {
            result.id.should.equal('toStore');
            result.name.should.equal('Hans');
            callback();
          });
        });
      },
      function (callback) {
        persistence1.save({id: 'toPersist2', name: 'Heinz2'}, function () {
          persistence1.getById('toPersist2', function (err, result) {
            result.id.should.equal('toPersist2');
            result.name.should.equal('Heinz2');
            callback();
          });
        });
      },
      function (callback) {
        persistence2.save({id: 'toStore2', name: 'Hans2'}, function () {
          persistence2.getById('toStore2', function (err, result) {
            result.id.should.equal('toStore2');
            result.name.should.equal('Hans2');
            callback();
          });
        });
      }
    ], done);
  });

});

