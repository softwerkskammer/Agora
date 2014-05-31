'use strict';

var uuid = require('node-uuid');
var expect = require('must');

describe('node-uuid', function () {
  var randomSeed = [
    0x10, 0x91, 0x56, 0xbe, 0xc4, 0xfb, 0xc1, 0xea,
    0x71, 0xb4, 0xef, 0xe1, 0x67, 0x1c, 0x58, 0x36
  ];

  it('node-uuid should return at least two different identifiers', function () {
    var id1 = uuid.v4({ random: randomSeed });
    var id2 = uuid.v4({ random: randomSeed });
    id1.must.not.be.equal(id2);
  });
});
