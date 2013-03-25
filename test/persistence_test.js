/*global describe, it, beforeEach */
"use strict";

var fs = require('fs');
var should = require('chai').should();
var createTeststore = function () {
  return require('../lib/persistence/persistence')('teststore');
};

var storeDir = 'lib/persistence/teststore';
var persistedFile = storeDir + '/toPersist.json';
if (fs.existsSync(persistedFile)) {
  fs.unlinkSync(persistedFile);
}
if (fs.existsSync(storeDir)) {
  fs.rmdirSync(storeDir);
}

describe('The store can persist objects and retrieve them', function () {
  var persistence;

  beforeEach(function () {
    persistence = createTeststore();
  });

  it('stores to the teststore', function () {
    var toPersist = {id: 'toPersist', name: 'Heinz'};
    persistence.save(toPersist);
  });

  it('retrieves none for non-existing id', function (done) {
    persistence.getById('non-existing-id', function (result) {
      should.not.exist(result);
      done();
    });
  });

  it('retrieves one from the teststore', function (done) {
    persistence.getById('toPersist', function (result) {
      result.id.should.equal('toPersist');
      result.name.should.equal('Heinz');
      done();
    });
  });

  it('retrieves all from the teststore', function () {
    persistence.list(function (result) {
      result.length.should.equal(1);
      result[0].name.should.equal('Heinz');
    });
  });

});

