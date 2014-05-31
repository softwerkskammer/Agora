'use strict';

var uuid = require('node-uuid');
var expect = require('must');

describe('node-uuid', function () {
  var randomSeed = [
    0x10, 0x91, 0x56, 0xbe, 0xc4, 0xfb, 0xc1, 0xea,
    0x71, 0xb4, 0xef, 0xe1, 0x67, 0x1c, 0x58, 0x36
  ];

  var randomSecondSeed = [
    0x10, 0x92, 0x56, 0xbe, 0xc4, 0xfb, 0xc1, 0xea,
    0x71, 0xb4, 0xdc, 0x0d, 0x37, 0x1c, 0x58, 0x36
  ];

  it('should return the same identifiers if the same seed is used', function () {
    var id1 = uuid.v4({ random: randomSeed });
    var id2 = uuid.v4({ random: randomSeed });
    id1.must.be.equal(id2);
  });

  it('should not return the same identifiers if different seeds are used', function () {
    var id1 = uuid.v4({ random: randomSeed });
    var id2 = uuid.v4({ random: randomSecondSeed });
    id1.must.not.be.equal(id2);
  });
});
