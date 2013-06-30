"use strict";

var conf = require('../configureForTest');
var systemUnderTest = conf.get('beans').get('misc');
var expect = require('chai').expect;

describe('toArray function', function () {

  it('transforms null to an empty array', function (done) {
    var result = systemUnderTest.toArray(null);

    expect(result).to.not.be.null;
    expect(result.length).to.equal(0);
    done();
  });

  it('transforms undefined to an empty array', function (done) {
    var result = systemUnderTest.toArray(undefined);

    expect(result).to.not.be.null;
    expect(result.length).to.equal(0);
    done();
  });

  it('transforms a single element to an array with that item', function (done) {
    var result = systemUnderTest.toArray('Test');

    expect(result).to.not.be.null;
    expect(result.length).to.equal(1);
    expect(result[0]).to.equal('Test');
    done();
  });

  it('transforms an array to the same array', function (done) {
    var result = systemUnderTest.toArray([ 'Test1', 'Test2' ]);

    expect(result).to.not.be.null;
    expect(result.length).to.equal(2);
    expect(result[0]).to.equal('Test1');
    expect(result[1]).to.equal('Test2');
    done();
  });

});

