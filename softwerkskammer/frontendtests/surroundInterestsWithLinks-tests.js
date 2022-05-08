/*global surroundInterestsWithLinks */
(function () {
  "use strict";

  describe("surround interests with link", function () {
    var expected =
      '<a href="/members/interests?interest=a">a</a>,<a href="/members/interests?interest=b"> b</a>,' +
      '<a href="/members/interests?interest=a%20b"> a b</a>,<a href="/members/interests?interest=a%3Bb"> a;b </a>,<a href="/members/interests?interest=cb">cb</a>';

    beforeEach(function (done) {
      $(document).ready(function () {
        done();
      });
    });

    it("creates links for each interest in an interests string (comma separated)", function () {
      var result = surroundInterestsWithLinks("a, b, a b, a;b ,cb");
      expect(result).to.equal(expected);
    });

    it("removes \" and ' and ( and ) from the url parameter", function () {
      var result = surroundInterestsWithLinks("a\"b'c(d)");
      expect(result).to.equal('<a href="/members/interests?interest=a%22b\'c(d)">a"b\'c(d)</a>');
    });

    it('surrounds a text inside class "interestify"', function () {
      expect($("#sixth").html()).to.equal(expected);
    });
  });
})();
