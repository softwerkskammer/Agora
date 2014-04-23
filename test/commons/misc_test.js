"use strict";

var conf = require('../../testutil/configureForTest');
var misc = conf.get('beans').get('misc');
var expect = require('must');
var moment = require('moment-timezone');
var wikiAPI = conf.get('beans').get('wikiAPI');

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

describe('arrayToLowerCaseRegExp function', function () {

  it('concatenates multiple strings', function () {
    var result = misc.arrayToLowerCaseRegExp(['StrInG', 'strong']);
    expect("StRing").to.match(result);
    expect("strong").to.match(result);
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
      expect(result).to.equal('http://localhost:17124/prefix/lastComponent');
    });

    it('concatenates parts with leading "/"', function () {
      var result = misc.toFullQualifiedUrl('/prefix', '/lastComponent');
      expect(result).to.equal('http://localhost:17124/prefix/lastComponent');
    });

    it('concatenates parts with trailing "/"', function () {
      var result = misc.toFullQualifiedUrl('prefix/', 'lastComponent/');
      expect(result).to.equal('http://localhost:17124/prefix/lastComponent');
    });

    it('concatenates parts with inside "/"', function () {
      var result = misc.toFullQualifiedUrl('pre/fix', 'last/Component');
      expect(result).to.equal('http://localhost:17124/pre/fix/last/Component');
    });

    it('removes only one trailing and one leading "/"', function () {
      var result = misc.toFullQualifiedUrl('//pre/fix//', '//last/Component//');
      expect(result).to.equal('http://localhost:17124//pre/fix///last/Component/');
    });
  });

});

describe('parseBlogPost', function () {

  it('returns a parsed blog post', function () {
    var post = "#Lean Coffee November 2013\n " +
      "\n" +
      "Und beim nächsten Mal haben wir dann.\n" +
      "\n" +
      "Diesen Blog gemacht.";
    var path = "blog_2013-11-01LeanCoffeeTest.md";

    var result = misc.parseBlogPost(path, post, wikiAPI.BLOG_ENTRY_REGEX);

    var expected = {"title": "Lean Coffee November 2013",
      "date": moment("2013-11-01", 'YYYY-MM-DD'),
      "teaser": "Und beim nächsten Mal haben wir dann."};
    expect(result.title).to.equal(expected.title);
    expect(result.date.isValid()).to.be(true);
    expect(result.date.isSame(expected.date)).to.be(true);
    expect(result.teaser).to.equal(expected.teaser);
  });

  it('returns undefined for empty input', function () {
    expect(misc.parseBlogPost("", "", wikiAPI.BLOG_ENTRY_REGEX)).to.be(undefined);
  });

  it('returns undefined if the date in the path is malformed', function () {
    expect(misc.parseBlogPost("blog_2000-01-0LeanCoffeeTest.md", "post", wikiAPI.BLOG_ENTRY_REGEX)).to.be(undefined);
  });

  it('returns properly if body is missing', function () {
    var post = "#Lean Coffee November 2013";
    var path = "blog_2013-11-01LeanCoffeeTest.md";

    var result = misc.parseBlogPost(path, post, wikiAPI.BLOG_ENTRY_REGEX);

    expect(result.title).to.equal("Lean Coffee November 2013");
    expect(result.teaser).to.be(undefined);
    expect(result.date.isValid()).to.be(true);
  });

  it('can parse a multitude of titles', function () {
    function parseTitle(post) {
      return misc.parseBlogPost("blog_2013-11-01LeanCoffeeTest.md", post, wikiAPI.BLOG_ENTRY_REGEX).title;
    }

    expect(parseTitle("#Lean Coffee November 2013")).to.equal("Lean Coffee November 2013");
    expect(parseTitle("#####Lean Coffee November 2013")).to.equal("Lean Coffee November 2013");
    expect(parseTitle("#####   Lean Coffee November 2013")).to.equal("Lean Coffee November 2013");
    expect(parseTitle("    #####   Lean Coffee November 2013")).to.equal("Lean Coffee November 2013");
    expect(parseTitle("    #   Lean Coffee November 2013")).to.equal("Lean Coffee November 2013");
    expect(parseTitle("       Lean Coffee November 2013")).to.equal("Lean Coffee November 2013");
    expect(parseTitle("    ##   Lean# Coffee November 2013")).to.equal("Lean# Coffee November 2013");
  });

  it('can parse a multitude of date variants', function () {
    var date = moment('2013-02-01', 'YYYY-MM-DD');
    function parseDate(datestring) {
      return misc.parseBlogPost("blog_" + datestring + "LeanCoffeeTest.md", "#Lean", wikiAPI.BLOG_ENTRY_REGEX).date;
    }

    expect(parseDate("2013-02-01").isSame(date)).to.be(true);
    expect(parseDate("2013-02-1").isSame(date)).to.be(true);
    expect(parseDate("2013-2-1").isSame(date)).to.be(true);
  });
});
