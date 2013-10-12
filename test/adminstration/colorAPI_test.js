"use strict";

var expect = require('chai').expect;
var sinon = require('sinon');
var sinonSandbox = sinon.sandbox.create();
var conf = require('../configureForTest');

var Color = conf.get('beans').get('color');
var store = conf.get('beans').get('colorstore');
var api = conf.get('beans').get('colorAPI');

var colorId = 'white';
var dummyColor = new Color({id: colorId, color: '#FF'});

describe('Color API', function () {
  afterEach(function (done) {
    sinonSandbox.restore();
    done();
  });

  it('returns all colors', function (done) {
    sinonSandbox.stub(store, 'allColors', function (callback) {
      return callback(null, [dummyColor]);
    });

    api.allColors(function (err, result) {
      expect(result).to.have.lengthOf(1);
      expect(result).to.contain(dummyColor);
      done();
    });
  });

  it('save color calls to store', function (done) {
    var storeSpy = sinonSandbox.stub(store, 'saveColor', function (color, callback) {
      callback(null, color);
    });

    api.saveColor(dummyColor, function () {
      expect(storeSpy.calledOnce, 'saveColor is called').to.be.true;
      expect(storeSpy.calledWith(dummyColor)).to.be.true;
      done();
    });
  });

  it('save colors calls to store', function (done) {
    var storeSpy = sinonSandbox.stub(store, 'saveAllColors', function (colors, callback) {
      callback(null, colors);
    });

    api.saveColors([dummyColor], function () {
      expect(storeSpy.calledOnce, 'saveColors is called').to.be.true;
      expect(storeSpy.calledWith([dummyColor])).to.be.true;
      done();
    });
  });
});

