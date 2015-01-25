'use strict';

require('../../testutil/configureForTest');
var expect = require('must');

var beans = require('simple-configure').get('beans');
var Subscriber = beans.get('subscriber');

describe('Subscriber\'s Addon', function () {

  it('is never undefined', function () {
    var subscriber = new Subscriber();
    expect(subscriber.addon()).to.exist();
  });

  it('finds the right addon', function () {
    var subscriber = new Subscriber({ _addon: {homeAddress: 'homeOne'} });
    expect(subscriber.addon().homeAddress()).to.equal('homeOne');
  });

});
