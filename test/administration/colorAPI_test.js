"use strict";

var expect = require('must');
var sinon = require('sinon');
var sinonSandbox = sinon.sandbox.create();
var conf = require('../../testutil/configureForTest');

var Color = conf.get('beans').get('color');
var store = conf.get('beans').get('colorstore');
var api = conf.get('beans').get('colorAPI');

var colorId = 'white';
var dummyColor = new Color({id: colorId, color: '#FF'});

describe('Color API', function () {
  afterEach(function () {
    sinonSandbox.restore();
  });

  it('returns all colors', function (done) {
    sinonSandbox.stub(store, 'allColors', function (callback) {
      return callback(null, [dummyColor]);
    });

    api.allColors(function (err, result) {
      expect(result).to.have.length(1);
      expect(result).to.contain(dummyColor);
      done(err);
    });
  });

  it('save color calls to store', function (done) {
    var storeSpy = sinonSandbox.stub(store, 'saveColor', function (color, callback) {
      callback(null);
    });

    api.saveColor(dummyColor, function (err) {
      expect(storeSpy.calledOnce, 'saveColor is called').to.be(true);
      expect(storeSpy.calledWith(dummyColor)).to.be(true);
      done(err);
    });
  });

  it('save colors calls to store', function (done) {
    var storeSpy = sinonSandbox.stub(store, 'saveAllColors', function (colors, callback) {
      callback(null, colors);
    });

    api.saveColors([dummyColor], function (err) {
      expect(storeSpy.calledOnce, 'saveColors is called').to.be(true);
      expect(storeSpy.calledWith([dummyColor])).to.be(true);
      done(err);
    });
  });
});

