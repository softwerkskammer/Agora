'use strict';

/*eslint no-underscore-dangle: 0*/

const R = require('ramda');

const conf = require('simple-configure');
const nametags = conf.get('nametags');

const gillardonTags = {
  tableWidth: '210mm', // colWidth * 3
  colWidth: '70mm',
  tagHeight: '38mm',
  bottomMargin: '-3mm',
  paperMargins: 'left=15mm, right=15mm, top=15mm, bottom=15mm'
};

const orcanaTags = {
  tableWidth: '276mm', // colWidth * 3
  colWidth: '92mm',
  tagHeight: '51mm',
  bottomMargin: '10mm',
  paperMargins: 'left=5mm, right=5mm, top=0mm, bottom=0mm'
};

const tags = nametags === 'orcana' ? orcanaTags : gillardonTags;


// whenever we perform nested calls on two or more object members (e.g. this.nametagsFor calls this._tablesFor calls this._tableFor),
// we need to re-bind 'this' to make it available for the subsequent nested calls.
module.exports = {
  nametagsFor: function nametagsFor(members) {
    return this._prefix() + this._tablesFor.bind(this)(members) + this._postfix();
  },

  _prefix: function _prefix() {
    return '\\documentclass[12pt]{scrbook}\n' +
      '\n' +
      '\\usepackage{ngerman}\n' +
      '\\usepackage[default,osfigures,scale=1]{opensans}\n' +
      '\\usepackage[utf8]{inputenc}\n' +
      '\\usepackage[T1]{fontenc}\n' +
      '\\usepackage{tabularx}\n' +
      '\\usepackage[a4paper, ' + tags.paperMargins + ', landscape]{geometry}\n' +
      '\n' +
      '\\pagestyle{empty}\n' +
      '\n' +
      '\\renewcommand{\\ttdefault}{lmtt}\n' +
      '\n' +
      '\\newcommand{\\nametag}[3]{%\n' +
      '  \\parbox[t]{' + tags.colWidth + '}{\\rule[0mm]{0mm}{' + tags.tagHeight + '}%\n' +
      '    \\hspace{10mm}' +
      '    \\begin{minipage}[b]{' + tags.colWidth + '}%\n' +
      '      {\\Huge \\textbf{#1}}\\\\[5mm]%\n' +
      '      {\\large #2}\\\\[5mm]%\n' +
      '    {\\Large \\textbf{\\texttt{#3}}}\\\\[' + tags.bottomMargin + ']%\n' +
      ' \\end{minipage}}}%\n' +
      '\n' +
      '\n' +
      '\\begin{document}\n';
  },

  _nametagFor: function _nametagFor(member) {
    const twitter = member.twitter() ? '@' + member.twitter().replace(/_/g, '\\_') : '';
    return '\\nametag{' + member.firstname() + '}{' + member.lastname() + '}{' + twitter + '}';
  },

  _lineFor: function _lineFor(members) {
    if (members.length > 3) {
      return 'ERROR! Passed more than 3 members to lineFor()';
    }
    return members.map(this._nametagFor).join(' & ') + '\\\\ \\hline \n';
  },

  _tableFor: function _tableFor(members) {
    if (members.length > 12) {
      return 'ERROR! Passed more than 12 members to tableFor()';
    }
    return '\\begin{tabularx}{' + tags.tableWidth + '}{|X|X|X|} \n' +
      '\\hline \n' +
      R.splitEvery(3, members).map(this._lineFor.bind(this)).join('') +
      '\n\\end{tabularx}\n\n\n';
  },

  _tablesFor: function _tablesFor(members) {
    return R.splitEvery(12, members).map(this._tableFor.bind(this)).join('');
  },

  _postfix: function _postfix() {
    return '\n' +
      '\\end{document}\n';
  }
};
