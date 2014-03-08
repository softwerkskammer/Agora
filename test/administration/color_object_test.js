"use strict";

require('../../testutil/configureForTest');
var conf = require('nconf');
var expect = require('chai').expect;

var Color = conf.get('beans').get('color');

describe('Color', function () {
  it('Color is initialized from id and color', function () {
    var color = new Color({
      color: '#FF',
      id: 'weiß oder so'
    });
    expect('#FF').to.equal(color.color);
    expect('weiß oder so').to.equal(color.id);
  });
});
