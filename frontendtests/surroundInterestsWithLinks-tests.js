/*global surroundInterestsWithLinks */
(function () {
  'use strict';

  describe('surround interests with link', function () {
    var expected = '<a href="/members/interests/a">a</a>,<a href="/members/interests/b"> b</a>,' +
      '<a href="/members/interests/a%20b"> a b</a>,<a href="/members/interests/a%3Bb"> a;b </a>,<a href="/members/interests/cb">cb</a>';

    it('creates links for each interest in an interests string (comma separated)', function () {
      var result = surroundInterestsWithLinks('a, b, a b, a;b ,cb');
      expect(result).to.equal(expected);
    });
    it('surrounds a text inside class "interestify"', function () {
      expect($('#sixth').html()).to.equal(expected);
    });
  });

}());
