'use strict';

var _ = require('lodash');

module.exports = {
  /*eslint no-underscore-dangle: 0*/

  nametagsFor: function (members) {
    return this._prefix() + this._tablesFor(members) + this._postfix();
  },

  _prefix: function () {
    return '\\documentclass[12pt,a4paper]{scrbook}\n' +
      '\n' +
      '\\usepackage{ngerman}\n' +
      '\\usepackage[default,osfigures,scale=0.95]{opensans}\n' +
      '\\usepackage[utf8]{inputenc}\n' +
      '\\usepackage[T1]{fontenc}\n' +
      '\\usepackage[a4paper, left=15mm, right=15mm, top=15mm, bottom=15mm, landscape]{geometry}\n' +
      '\n' +
      '\\pagestyle{empty}\n' +
      '\n' +
      '\n' +
      '\\newcommand{\\nametag}[3]{%\n' +
      '  \\parbox[t]{7cm}{\\rule[0mm]{0mm}{38mm}%\n' +
      '    \\begin{minipage}[b]{7cm}%\n' +
      '      {\\Huge \\textbf{#1}}\\\\[5mm]%\n' +
      '      {\\large #2}\\\\[5mm]%\n' +
      '    {\\Large \\textbf{#3}}\\\\[-3mm]%\n' +
      ' \\end{minipage}}}%\n' +
      '\n' +
      '\n' +
      '\\begin{document}\n';
  },

  _nametagFor: function (member) {
    var twitter = member.twitter() ? '@' + member.twitter().replace(/_/g, '\\_') : '';
    return '\\nametag{' + member.firstname() + '}{' + member.lastname() + '}{' + twitter + '}';
  },

  _lineFor: function (members) {
    var self = this;
    if (members.length > 3) {
      return 'ERROR! Passed more than 3 members to lineFor()';
    }
    return _.map(members, function (member) { return self._nametagFor(member); }).join(' & ') + '\\\\ \\hline \n';
  },

  _tableFor: function (members) {
    var self = this;
    if (members.length > 12) {
      return 'ERROR! Passed more than 12 members to tableFor()';
    }
    return '\\begin{tabular}{|p{7cm}|p{7cm}|p{7cm}|} \n' +
      '\\hline \n' +
      _.map(_.range(0, members.length, 3), function (startIndex) { return self._lineFor(members.slice(startIndex, startIndex + 3)); }).join('') +
      '\n\\end{tabular}\n\n\n';
  },

  _tablesFor: function (members) {
    var self = this;
    return _.map(_.range(0, members.length, 12),
      function (startIndex) { return self._tableFor(members.slice(startIndex, startIndex + 12)); }).join('');
  },

  _postfix: function () {
    return '\n' +
      '\\end{document}\n';
  }

};
