/*global describe, it, beforeEach */
"use strict";

var fs = require('fs'),
  path = require('path'),
  should = require('chai').should();

var createTeststore = function () {
  return require('../lib/persistence/persistence')('teststore');
};

var storeDir = 'lib/persistence/teststore';

describe('The persistence store', function () {
  var persistence;
  var toPersist = {id: 'toPersist', name: 'Heinz'};

  var storeSampleData = function (done) {
    persistence.save(toPersist, done);
  };

  var clearStore = function () {
    var persistedFile = path.join(storeDir, toPersist.id + '.json');
    if (fs.existsSync(persistedFile)) {
      fs.unlinkSync(persistedFile);
    }
    if (fs.existsSync(storeDir)) {
      fs.rmdirSync(storeDir);
    }
  };

  beforeEach(function () {
    clearStore();
    persistence = createTeststore();
  });

  it('retrieves none for non-existing id', function (done) {
    persistence.getById('non-existing-id', function (result) {
      should.not.exist(result);
      done();
    });
  });

  it('retrieves one for existing id', function (done) {
    storeSampleData(function () {
      persistence.getById('toPersist', function (result) {
        result.id.should.equal('toPersist');
        result.name.should.equal('Heinz');
        done();
      });
    });
  });

  it('retrieves an empty list when no data is inserted', function (done) {
    persistence.list(function (result) {
      result.length.should.equal(0);
      done();
    });
  });

  it('retrieves all', function (done) {
    storeSampleData(function () {
      persistence.list(function (result) {
        result.length.should.equal(1);
        result[0].name.should.equal('Heinz');
        done();
      });
    });
  });

});

