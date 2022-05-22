"use strict";
const expect = require("must-dist");

const beans = require("../../testutil/configureForTest").get("beans");
const misc = beans.get("misc");

describe("toArray function", () => {
  it("transforms null to an empty array", () => {
    const result = misc.toArray(null);
    expect(result.length).to.equal(0);
  });

  it("transforms undefined to an empty array", () => {
    const result = misc.toArray(undefined);
    expect(result.length).to.equal(0);
  });

  it("transforms a single element to an array with that item", () => {
    const result = misc.toArray("Test");
    expect(result.length).to.equal(1);
    expect(result[0]).to.equal("Test");
  });

  it("transforms an array to the same array", () => {
    const result = misc.toArray(["Test1", "Test2"]);
    expect(result.length).to.equal(2);
    expect(result[0]).to.equal("Test1");
    expect(result[1]).to.equal("Test2");
  });

  it("transforms a comma separated list to an array with the items", () => {
    const result = misc.toArray("Test,Test,Test");
    expect(result.length).to.equal(3);
    expect(result[0]).to.equal("Test");
    expect(result[1]).to.equal("Test");
    expect(result[2]).to.equal("Test");
  });
});

describe("toLowerCaseRegExp function", () => {
  it("transforms a string to a regexp", () => {
    const result = misc.toLowerCaseRegExp("string");
    expect(result.toString()).to.equal("/^string$/i");
    expect("String").to.match(result);
  });

  it("is case insensitive", () => {
    const result = misc.toLowerCaseRegExp("StrInG");
    expect("StRing").to.match(result);
  });

  it("escapes special regexp characters", () => {
    const result = misc.toLowerCaseRegExp("All of these should be escaped: \\ ^ $ * + ? . ( ) | { } [ ]");
    expect(result.toString()).to.equal(
      "/^All of these should be escaped: \\\\ \\^ \\$ \\* \\+ \\? \\. \\( \\) \\| \\{ \\} \\[ \\]$/i"
    );
  });
});

describe("arrayToLowerCaseRegExp function", () => {
  it("concatenates multiple strings", () => {
    const result = misc.arrayToLowerCaseRegExp(["StrInG", "strong"]);
    expect("StRing").to.match(result);
    expect("strong").to.match(result);
  });

  it("concatenates multiple strings rsulting in regex", () => {
    const result = misc.arrayToLowerCaseRegExp(["StrInG", "strong"]);
    expect(result.toString()).to.equal("/^StrInG$|^strong$/i");
  });
});

describe("differenceCaseInsensitive function", () => {
  it("filters lowercase strings", () => {
    const rightside = ["a@b.com"];
    const leftside = ["a@b.com", "c@d.de"];
    const result = misc.differenceCaseInsensitive(leftside, rightside);
    expect(result).to.contain("c@d.de");
    expect(result).to.not.contain("a@b.com");
    expect(result.length).to.equal(1);
  });

  it("filters found addresses case insensitive", () => {
    const rightside = ["a@b.com"];
    const leftside = ["a@b.coM", "c@d.de"];
    const result = misc.differenceCaseInsensitive(leftside, rightside);
    expect(result).to.contain("c@d.de");
    expect(result).to.not.contain("a@b.coM");
    expect(result.length).to.equal(1);
  });

  it("filters found addresses case insensitive inverse", () => {
    const rightside = ["a@b.coM"];
    const leftside = ["a@b.com", "c@d.de"];
    const result = misc.differenceCaseInsensitive(leftside, rightside);
    expect(result).to.contain("c@d.de");
    expect(result).to.not.contain("a@b.coM");
    expect(result.length).to.equal(1);
  });

  it("ignores undefined inputs on right side", () => {
    const leftside = ["a@b.com", "c@d.de"];
    const result = misc.differenceCaseInsensitive(leftside, undefined);
    expect(result).to.contain("c@d.de");
    expect(result).to.contain("a@b.com");
    expect(result.length).to.equal(2);
  });

  it("works with more on right side than on left side", () => {
    const leftside = ["a@b.com", "c@d.de"];
    const rightside = ["a@b.com", "c@d.de", "kkkkk"];
    const result = misc.differenceCaseInsensitive(leftside, rightside);
    expect(result).to.not.contain("c@d.de");
    expect(result).to.not.contain("a@b.com");
    expect(result.length).to.equal(0);
  });

  it("filters with more on right side than on left side", () => {
    const leftside = ["a@b.com", "c@d.de"];
    const rightside = ["k@b.com", "c@d.de", "kkkkk"];
    const result = misc.differenceCaseInsensitive(leftside, rightside);
    expect(result).to.not.contain("c@d.de");
    expect(result).to.contain("a@b.com");
    expect(result.length).to.equal(1);
  });

  it("ignores undefined inputs on left side", () => {
    const rightside = ["a@b.coM"];
    const result = misc.differenceCaseInsensitive(undefined, rightside);
    expect(result.length).to.equal(0);
  });

  it("ignores arrays with null", () => {
    const rightside = [null];
    const leftside = [null];
    const result = misc.differenceCaseInsensitive(leftside, rightside);
    expect(result.length).to.equal(0);
  });

  describe("toFullQualifiedUrl function", () => {
    it("concatenates simple parts", () => {
      const result = misc.toFullQualifiedUrl("prefix", "lastComponent");
      expect(result).to.equal("http://localhost:17125/prefix/lastComponent");
    });

    it('concatenates parts with leading "/"', () => {
      const result = misc.toFullQualifiedUrl("/prefix", "/lastComponent");
      expect(result).to.equal("http://localhost:17125/prefix/lastComponent");
    });

    it('concatenates parts with trailing "/"', () => {
      const result = misc.toFullQualifiedUrl("prefix/", "lastComponent/");
      expect(result).to.equal("http://localhost:17125/prefix/lastComponent");
    });

    it('concatenates parts with inside "/"', () => {
      const result = misc.toFullQualifiedUrl("pre/fix", "last/Component");
      expect(result).to.equal("http://localhost:17125/pre/fix/last/Component");
    });

    it('removes only one trailing and one leading "/"', () => {
      const result = misc.toFullQualifiedUrl("//pre/fix//", "//last/Component//");
      expect(result).to.equal("http://localhost:17125//pre/fix///last/Component/");
    });
  });
});

describe("validate function", () => {
  it("returns true if the new value is identical to the previous value", async () => {
    const result = await misc.validate("abc", "abc");
    expect(result).to.equal("true");
  });

  it("returns true if the new value is different to the previous value and the validator returns true", async () => {
    const result = await misc.validate("def", "abc", () => true);
    expect(result).to.equal("true");
  });

  it("returns false if the new value is different to the previous value and the validator returns false", async () => {
    const result = await misc.validate("def", "abc", () => false);
    expect(result).to.equal("false");
  });

  it("returns false if the new value is different to the previous value and the validator returns an error", async () => {
    const validator = () => {
      throw new Error("Error!");
    };

    const result = await misc.validate("def", "abc", validator);
    expect(result).to.equal("false");
  });

  it("trims the new value", async () => {
    const result = await misc.validate(" abc ", "abc");
    expect(result).to.equal("true");
  });

  it("trims the previous value", async () => {
    const result = await misc.validate("abc", " abc ");
    expect(result).to.equal("true");
  });

  it("returns false when the current value is null", async () => {
    const result = await misc.validate(null, null, undefined);
    expect(result).to.equal("false");
  });
});

describe("represents image", () => {
  it("accepts a full name", () => {
    expect(misc.representsImage("file.jpg")).to.be.true();
  });

  it("accepts an extension (without .)", () => {
    expect(misc.representsImage("jpg")).to.be.true();
  });

  it("accepts an extension (with .)", () => {
    expect(misc.representsImage(".jpg")).to.be.true();
  });

  it("does not accept a word doc", () => {
    expect(misc.representsImage(".doc")).to.be.false();
  });
});

describe("betweenBraces", () => {
  it("extracts the string between braces in simple cases", () => {
    expect(misc.betweenBraces("some text (lolo)")).to.be("lolo");
  });

  it("extracts the string between braces if text before has opening brace", () => {
    expect(misc.betweenBraces("some t(ext (lolo)")).to.be("lolo");
  });

  it("extracts the string between braces if text before has closing brace", () => {
    expect(misc.betweenBraces("some tex)t (lolo)")).to.be("lolo");
  });

  it("extracts the string between braces if text inside braces has opening brace", () => {
    expect(misc.betweenBraces("some text (l(olo)")).to.be("l(olo");
  });

  it("extracts the string between braces if inside braces has closing brace", () => {
    expect(misc.betweenBraces("some text (lo)lo)")).to.be("lo)lo");
  });

  it("returns the string if there are no braces", () => {
    expect(misc.betweenBraces("nicknameonly")).to.be("nicknameonly");
  });

  it("returns the string if there is an opening brace without blank", () => {
    expect(misc.betweenBraces("nickname(only")).to.be("nickname(only");
  });

  it("returns the string if there is an opening brace without blank even if it ends with closing brace", () => {
    expect(misc.betweenBraces("nickname(only)")).to.be("nickname(only)");
  });
});

describe("compact", () => {
  it("compacts an array", () => {
    expect(misc.compact([])).to.eql([]);
    expect(misc.compact([false, undefined, null, 0, ""])).to.eql([]);
    expect(misc.compact([true, 1, []])).to.eql([true, 1, []]);
  });

  it("turns a non-array into an empty array", () => {
    expect(misc.compact(0)).to.eql([]);
    expect(misc.compact(false)).to.eql([]);
    expect(misc.compact("")).to.eql([]);
    expect(misc.compact(1)).to.eql([]);
    expect(misc.compact(true)).to.eql([]);
  });

  it("explodes a string", () => {
    expect(misc.compact("abc")).to.eql(["a", "b", "c"]);
  });
});
