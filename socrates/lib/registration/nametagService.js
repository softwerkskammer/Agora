'use strict';

var _ = require('lodash');

var prefix = function () {
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
    '    {\\Large \\textbf{@#3}}\\\\[-3mm]%\n' +
    ' \\end{minipage}}}%\n' +
    '\n' +
    '\n' +
    '\\begin{document}\n';
}

var lineFor = function (members) {
  if (members.length > 3) {
    return 'ERROR! Passed more than 3 members to lineFor()';
  }
  return _.map(members, function (member) {
      return '\\nametag{' + member.firstname() + '}{' + member.lastname() + '}{' + member.twitter() + '}';
    }).join(' & ') + '\\\\ \\hline \n';
}

var tableFor = function (members) {
  if (members.length > 12) {
    return 'ERROR! Passed more than 12 members to tableFor()';
  }
  return '\\begin{tabular}{|p{7cm}|p{7cm}|p{7cm}|} \n' +
    '\\hline \n' +
    lineFor(members.slice(0, 3)) + lineFor(members.slice(3, 6)) + lineFor(members.slice(6, 9)) + lineFor(members.slice(9, 12)) +
    '\n' +
    '\\end{tabular}\n';
}

var tablesFor = function (members) {
  return _.map(_.range(0, members.length, 12),
    function (startIndex) { return tableFor(members.slice(startIndex, startIndex + 12)); });
}

var postfix = function () {
  return '\n' +
    '\\end{document}\n';
}

module.exports = {

  nametagsFor: function (members) {
    return prefix() + tablesFor(members) + postfix();
  }

};
