"use strict";

var conf = require('../configureForTest');
var misc = conf.get('beans').get('misc');
var expect = require('chai').expect;

describe('toArray function', function () {

  it('transforms null to an empty array', function () {
    var result = misc.toArray(null);
    expect(result.length).to.equal(0);
  });

  it('transforms undefined to an empty array', function () {
    var result = misc.toArray(undefined);
    expect(result.length).to.equal(0);
  });

  it('transforms a single element to an array with that item', function () {
    var result = misc.toArray('Test');
    expect(result.length).to.equal(1);
    expect(result[0]).to.equal('Test');
  });

  it('transforms an array to the same array', function () {
    var result = misc.toArray([ 'Test1', 'Test2' ]);
    expect(result.length).to.equal(2);
    expect(result[0]).to.equal('Test1');
    expect(result[1]).to.equal('Test2');
  });

  it('transforms a comma separated list to an array with the items', function () {
    var result = misc.toArray('Test,Test,Test');
    expect(result.length).to.equal(3);
    expect(result[0]).to.equal('Test');
    expect(result[1]).to.equal('Test');
    expect(result[2]).to.equal('Test');
  });

});

describe('toLowerCaseRegExp function', function () {

  it('transforms a string to a regexp', function () {
    var result = misc.toLowerCaseRegExp("string");
    expect(result.toString()).to.equal("/^string$/i");
    expect("String").to.match(result);
  });

  it('is case insensitive', function () {
    var result = misc.toLowerCaseRegExp("StrInG");
    expect("StRing").to.match(result);
  });

  it('escapes special regexp characters', function () {
    var result = misc.toLowerCaseRegExp("All of these should be escaped: \\ ^ $ * + ? . ( ) | { } [ ]");
    expect(result.toString()).to.equal("/^All of these should be escaped: \\\\ \\^ \\$ \\* \\+ \\? \\. \\( \\) \\| \\{ \\} \\[ \\]$/i");
  });

});
