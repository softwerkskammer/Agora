'use strict';

const _ = require('lodash');

const conf = require('simple-configure');

const orcana = conf.get('nametags') === 'orcana';

const gillardonTags = {
  colWidth: '7cm',
  tagHeight: '38mm',
  bottomMargin: '-3mm',
  paperMargins: 'left=15mm, right=15mm, top=15mm, bottom=15mm'
};

const orcanaTags = {
  colWidth: '81mm',
  tagHeight: '51mm',
  bottomMargin: '10mm',
  paperMargins: 'left=15mm, right=15mm, top=0mm, bottom=0mm'
};

const colWidth = orcana ? orcanaTags.colWidth : gillardonTags.colWidth;
const tagHeight = orcana ? orcanaTags.tagHeight : gillardonTags.tagHeight;
const bottomMargin = orcana ? orcanaTags.bottomMargin : gillardonTags.bottomMargin;
const paperMargins = orcana ? orcanaTags.paperMargins : gillardonTags.paperMargins;

module.exports = {
  /*eslint no-underscore-dangle: 0*/

  nametagsFor: function nametagsFor(members) {
    return this._prefix() + this._tablesFor(members) + this._postfix();
  },

  _prefix: function _prefix() {

    return '\\documentclass[12pt,a4paper]{scrbook}\n' +
      '\n' +
      '\\usepackage{ngerman}\n' +
      '\\usepackage[default,osfigures,scale=0.95]{opensans}\n' +
      '\\usepackage[utf8]{inputenc}\n' +
      '\\usepackage[T1]{fontenc}\n' +
      '\\usepackage[a4paper, ' + paperMargins + ', landscape]{geometry}\n' +
      '\n' +
      '\\pagestyle{empty}\n' +
      '\n' +
      '\n' +
      '\\newcommand{\\nametag}[3]{%\n' +
      '  \\parbox[t]{' + colWidth + '}{\\rule[0mm]{0mm}{' + tagHeight + '}%\n' +
      '    \\begin{minipage}[b]{' + colWidth + '}%\n' +
      '      {\\Huge \\textbf{#1}}\\\\[5mm]%\n' +
      '      {\\large #2}\\\\[5mm]%\n' +
      '    {\\Large \\textbf{#3}}\\\\[' + bottomMargin + ']%\n' +
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
    const self = this;
    if (members.length > 3) {
      return 'ERROR! Passed more than 3 members to lineFor()';
    }
    return members.map(member => self._nametagFor(member)).join(' & ') + '\\\\ \\hline \n';
  },

  _tableFor: function _tableFor(members) {
    const self = this;
    if (members.length > 12) {
      return 'ERROR! Passed more than 12 members to tableFor()';
    }
    return '\\begin{tabular}{|p{' + colWidth + '}|p{' + colWidth + '}|p{' + colWidth + '}|} \n' +
      '\\hline \n' +
      _.range(0, members.length, 3).map(startIndex => self._lineFor(members.slice(startIndex, startIndex + 3))).join('') +
      '\n\\end{tabular}\n\n\n';
  },

  _tablesFor: function _tablesFor(members) {
    const self = this;
    return _.range(0, members.length, 12).map(startIndex => self._tableFor(members.slice(startIndex, startIndex + 12))).join('');
  },

  _postfix: function _postfix() {
    return '\n' +
      '\\end{document}\n';
  }

};
