'use strict';
/*eslint no-underscore-dangle: 0*/

var expect = require('must-dist');
var beans = require('../../testutil/configureForTest').get('beans');

var nametagService = beans.get('nametagService');
var Member = beans.get('member');

describe('Nametag Service', function () {
  it('returns a line for a member without twitter handle', function () {
    expect(nametagService._nametagFor(new Member({firstname: 'Hans', lastname: 'Dampf'}))).to.equal('\\nametag{Hans}{Dampf}{}');
    expect(nametagService._nametagFor(new Member({firstname: 'Hans', lastname: 'Dampf', twitter: undefined}))).to.equal('\\nametag{Hans}{Dampf}{}');
    expect(nametagService._nametagFor(new Member({firstname: 'Hans', lastname: 'Dampf', twitter: null}))).to.equal('\\nametag{Hans}{Dampf}{}');
  });

  it('escapes all underscores in a twitter handle', function () {
    expect(nametagService._nametagFor(new Member({firstname: 'Hans', lastname: 'Dampf', twitter: 'a_b'}))).to.equal('\\nametag{Hans}{Dampf}{@a\\_b}');
    expect(nametagService._nametagFor(new Member({firstname: 'Hans', lastname: 'Dampf', twitter: 'a_b_c'}))).to.equal('\\nametag{Hans}{Dampf}{@a\\_b\\_c}');
  });
});
