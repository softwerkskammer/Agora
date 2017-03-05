'use strict';
/*eslint no-underscore-dangle: 0*/

const expect = require('must-dist');
const beans = require('../../testutil/configureForTest').get('beans');

const nametagService = beans.get('nametagService');
const Member = beans.get('member');
const conf = require('simple-configure');
const width = conf.get('nametags') === 'orcana' ? '276' : '210';

describe('Nametag Service', () => {
  it('returns a nametag for a member without twitter handle', () => {
    expect(nametagService._nametagFor(new Member({firstname: 'Hans', lastname: 'Dampf'}))).to.equal('\\nametag{Hans}{Dampf}{}');
    expect(nametagService._nametagFor(new Member({firstname: 'Hans', lastname: 'Dampf', twitter: undefined}))).to.equal('\\nametag{Hans}{Dampf}{}');
    expect(nametagService._nametagFor(new Member({firstname: 'Hans', lastname: 'Dampf', twitter: null}))).to.equal('\\nametag{Hans}{Dampf}{}');
  });

  it('escapes all underscores in a twitter handle', () => {
    expect(nametagService._nametagFor(new Member({firstname: 'Hans', lastname: 'Dampf', twitter: 'a_b'}))).to.equal('\\nametag{Hans}{Dampf}{@a\\_b}');
    expect(nametagService._nametagFor(new Member({firstname: 'Hans', lastname: 'Dampf', twitter: 'a_b_c'}))).to.equal('\\nametag{Hans}{Dampf}{@a\\_b\\_c}');
  });

  it('returns a line for up to three members', () => {
    expect(nametagService._lineFor([new Member({firstname: 'Hans', lastname: 'Dampf'})])).to.equal('\\nametag{Hans}{Dampf}{}\\\\ \\hline \n');
  });

  it('returns a table for up to twelve members', () => {
    expect(nametagService._tableFor([new Member({firstname: 'Hans', lastname: 'Dampf'})])).to.equal(
      '\\begin{tabularx}{' + width + 'mm}{|X|X|X|} \n' +
      '\\hline \n\\nametag{Hans}{Dampf}{}\\\\ \\hline \n' +
      '\n\\end{tabularx}\n\n\n');
  });

  it('returns tables for an arbitrary number of members', () => {
    expect(nametagService._tablesFor([new Member({firstname: 'Hans', lastname: 'Dampf'})])).to.equal(
      '\\begin{tabularx}{' + width + 'mm}{|X|X|X|} \n' +
      '\\hline \n\\nametag{Hans}{Dampf}{}\\\\ \\hline \n' +
      '\n\\end{tabularx}\n\n\n');
  });

  it('returns tables for an arbitrary number of members and splits every 12 members for a new page and every 3 for a new row', () => {
    const member = new Member({firstname: 'Hans', lastname: 'Dampf'});
    expect(nametagService._tablesFor([member, member, member, member, member, member, member, member, member, member, member, member, member, member, member])).to.be(
      '\\begin{tabularx}{' + width + 'mm}{|X|X|X|} \n\\hline ' + '\n' +
      '\\nametag{Hans}{Dampf}{} & \\nametag{Hans}{Dampf}{} & \\nametag{Hans}{Dampf}{}\\\\ \\hline \n' +
      '\\nametag{Hans}{Dampf}{} & \\nametag{Hans}{Dampf}{} & \\nametag{Hans}{Dampf}{}\\\\ \\hline \n' +
      '\\nametag{Hans}{Dampf}{} & \\nametag{Hans}{Dampf}{} & \\nametag{Hans}{Dampf}{}\\\\ \\hline \n' +
      '\\nametag{Hans}{Dampf}{} & \\nametag{Hans}{Dampf}{} & \\nametag{Hans}{Dampf}{}\\\\ \\hline \n' +
      '\n\\end{tabularx}\n\n\n' +
      '\\begin{tabularx}{' + width + 'mm}{|X|X|X|} \n' + '\\hline \n' +
      '\\nametag{Hans}{Dampf}{} & \\nametag{Hans}{Dampf}{} & \\nametag{Hans}{Dampf}{}\\\\ \\hline \n' +
      '\n\\end{tabularx}\n\n\n');
  });
});
