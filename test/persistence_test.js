"use strict";

var fs = require('fs');

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

  it('stores to the teststore', function () {
    var toPersist = {id: 'toPersist', name: 'Heinz'};
    var persistence = createTeststore();
    persistence.save(toPersist);

    persistence.getById('toPersist', function (result) {
      result.id.should.equal('toPersist');
      result.name.should.equal('Heinz');
    });
  });

});

