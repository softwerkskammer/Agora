'use strict';
var expect = require('must-dist');

var beans = require('../../testutil/configureForTest').get('beans');
var misc = beans.get('misc');

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
    var result = misc.toArray(['Test1', 'Test2']);
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
    var result = misc.toLowerCaseRegExp('string');
    expect(result.toString()).to.equal('/^string$/i');
    expect('String').to.match(result);
  });

  it('is case insensitive', function () {
    var result = misc.toLowerCaseRegExp('StrInG');
    expect('StRing').to.match(result);
  });

  it('escapes special regexp characters', function () {
    var result = misc.toLowerCaseRegExp('All of these should be escaped: \\ ^ $ * + ? . ( ) | { } [ ]');
    expect(result.toString()).to.equal('/^All of these should be escaped: \\\\ \\^ \\$ \\* \\+ \\? \\. \\( \\) \\| \\{ \\} \\[ \\]$/i');
  });
});

describe('arrayToLowerCaseRegExp function', function () {

  it('concatenates multiple strings', function () {
    var result = misc.arrayToLowerCaseRegExp(['StrInG', 'strong']);
    expect('StRing').to.match(result);
    expect('strong').to.match(result);
  });

  it('concatenates multiple strings rsulting in regex', function () {
    var result = misc.arrayToLowerCaseRegExp(['StrInG', 'strong']);
    expect(result.toString()).to.equal('/^StrInG$|^strong$/i');
  });
});

describe('differenceCaseInsensitive function', function () {
  it('filters lowercase strings', function () {
    var rightside = ['a@b.com'];
    var leftside = ['a@b.com', 'c@d.de'];
    var result = misc.differenceCaseInsensitive(leftside, rightside);
    expect(result).to.contain('c@d.de');
    expect(result).to.not.contain('a@b.com');
    expect(result.length).to.equal(1);
  });

  it('filters found addresses case insensitive', function () {
    var rightside = ['a@b.com'];
    var leftside = ['a@b.coM', 'c@d.de'];
    var result = misc.differenceCaseInsensitive(leftside, rightside);
    expect(result).to.contain('c@d.de');
    expect(result).to.not.contain('a@b.coM');
    expect(result.length).to.equal(1);
  });

  it('filters found addresses case insensitive inverse', function () {
    var rightside = ['a@b.coM'];
    var leftside = ['a@b.com', 'c@d.de'];
    var result = misc.differenceCaseInsensitive(leftside, rightside);
    expect(result).to.contain('c@d.de');
    expect(result).to.not.contain('a@b.coM');
    expect(result.length).to.equal(1);
  });

  it('ignores undefined inputs on right side', function () {
    var leftside = ['a@b.com', 'c@d.de'];
    var result = misc.differenceCaseInsensitive(leftside, undefined);
    expect(result).to.contain('c@d.de');
    expect(result).to.contain('a@b.com');
    expect(result.length).to.equal(2);
  });

  it('works with more on right side than on left side', function () {
    var leftside = ['a@b.com', 'c@d.de'];
    var rightside = ['a@b.com', 'c@d.de', 'kkkkk'];
    var result = misc.differenceCaseInsensitive(leftside, rightside);
    expect(result).to.not.contain('c@d.de');
    expect(result).to.not.contain('a@b.com');
    expect(result.length).to.equal(0);
  });

  it('filters with more on right side than on left side', function () {
    var leftside = ['a@b.com', 'c@d.de'];
    var rightside = ['k@b.com', 'c@d.de', 'kkkkk'];
    var result = misc.differenceCaseInsensitive(leftside, rightside);
    expect(result).to.not.contain('c@d.de');
    expect(result).to.contain('a@b.com');
    expect(result.length).to.equal(1);
  });

  it('ignores undefined inputs on left side', function () {
    var rightside = ['a@b.coM'];
    var result = misc.differenceCaseInsensitive(undefined, rightside);
    expect(result.length).to.equal(0);
  });

  it('ignores arrays with null', function () {
    var rightside = [null];
    var leftside = [null];
    var result = misc.differenceCaseInsensitive(leftside, rightside);
    expect(result.length).to.equal(0);
  });

  describe('toFullQualifiedUrl function', function () {

    it('concatenates simple parts', function () {
      var result = misc.toFullQualifiedUrl('prefix', 'lastComponent');
      expect(result).to.equal('http://localhost:17125/prefix/lastComponent');
    });

    it('concatenates parts with leading "/"', function () {
      var result = misc.toFullQualifiedUrl('/prefix', '/lastComponent');
      expect(result).to.equal('http://localhost:17125/prefix/lastComponent');
    });

    it('concatenates parts with trailing "/"', function () {
      var result = misc.toFullQualifiedUrl('prefix/', 'lastComponent/');
      expect(result).to.equal('http://localhost:17125/prefix/lastComponent');
    });

    it('concatenates parts with inside "/"', function () {
      var result = misc.toFullQualifiedUrl('pre/fix', 'last/Component');
      expect(result).to.equal('http://localhost:17125/pre/fix/last/Component');
    });

    it('removes only one trailing and one leading "/"', function () {
      var result = misc.toFullQualifiedUrl('//pre/fix//', '//last/Component//');
      expect(result).to.equal('http://localhost:17125//pre/fix///last/Component/');
    });
  });

});

describe('validate function', function () {
  it('returns true if the new value is identical to the previous value', function (done) {
    misc.validate('abc', 'abc', undefined, function (result) {
      expect(result).to.equal('true');
      done();
    });
  });

  it('returns true if the new value is different to the previous value and the validator returns true', function (done) {
    var validator = function (value, callback) { callback(null, true); };

    misc.validate('def', 'abc', validator, function (result) {
      expect(result).to.equal('true');
      done();
    });
  });

  it('returns false if the new value is different to the previous value and the validator returns false', function (done) {
    var validator = function (value, callback) { callback(null, false); };

    misc.validate('def', 'abc', validator, function (result) {
      expect(result).to.equal('false');
      done();
    });
  });

  it('returns false if the new value is different to the previous value and the validator returns an error', function (done) {
    var validator = function (value, callback) { callback(new Error('Error!')); };

    misc.validate('def', 'abc', validator, function (result) {
      expect(result).to.equal('false');
      done();
    });
  });

  it('trims the new value', function (done) {
    misc.validate(' abc ', 'abc', undefined, function (result) {
      expect(result).to.equal('true');
      done();
    });
  });

  it('trims the previous value', function (done) {
    misc.validate('abc', ' abc ', undefined, function (result) {
      expect(result).to.equal('true');
      done();
    });
  });

  it('works with two null values', function (done) {
    misc.validate(null, null, undefined, function (result) {
      expect(result).to.equal('true');
      done();
    });
  });

});

describe('represents image', function () {
  it('accepts a full name', function () {
    expect(misc.representsImage('file.jpg')).to.be.true();
  });

  it('accepts an extension (without .)', function () {
    expect(misc.representsImage('jpg')).to.be.true();
  });

  it('accepts an extension (with .)', function () {
    expect(misc.representsImage('.jpg')).to.be.true();
  });

  it('does not accept a word doc', function () {
    expect(misc.representsImage('.doc')).to.be.false();
  });
});
