/*global describe, it, beforeEach */
"use strict";

var should = require('chai').should(),
MongoConf = require('./mongoConf'),
  conf = new MongoConf();

var createTeststore = function () {
  return require('../lib/persistence/persistence')('teststore', conf);
};

describe('The persistence store', function () {
  var persistence;
  var toPersist = {id: 'toPersist', name: 'Heinz'};

  var storeSampleData = function (done) {
    persistence.save(toPersist, done);
  };

  var clearStore = function (done) {
    createTeststore().drop(function () {
      done(); // here we can ignore errors
    });
  };

  beforeEach(function (done) {
    clearStore(done);
    persistence = createTeststore();
  });

  it('retrieves none for non-existing id', function (done) {
    persistence.getById('non-existing-id', function (err, result) {
      should.not.exist(result);
      done(err);
    });
  });

  it('retrieves one for existing id', function (done) {
    storeSampleData(function () {
      persistence.getById('toPersist', function (err, result) {
        result.id.should.equal('toPersist');
        result.name.should.equal('Heinz');
        done(err);
      });
    });
  });

  it('retrieves an empty list when no data is inserted', function (done) {
    persistence.list(function (err, result) {
      result.length.should.equal(0);
      done(err);
    });
  });

  it('retrieves all', function (done) {
    storeSampleData(function () {
      persistence.list(function (err, result) {
        result.length.should.equal(1);
        result[0].name.should.equal('Heinz');
        done(err);
      });
    });
  });

});

