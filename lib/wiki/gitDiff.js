"use strict";

function Diff(diffString) {
  var self = this;
  self.diff = diffString;
}

var ldln = 0;
var cdln;

function leftDiffLineNumber(id, line) {
  switch (true) {
  case line.slice(0, 2) === '@@':
    var li = line.match(/\-(\d+)/)[1];
    ldln = parseInt(li, 10);
    cdln = ldln;
    return '...';

  case line.slice(0, 1) === '+':
    return '';

  default:
    ldln++;
    cdln = ldln - 1;
    return cdln;
  }
}

var rdln = 0;

function rightDiffLineNumber(id, line) {

  switch (true) {
  case line.slice(0, 2) === '@@':
    var ri = line.match(/\+(\d+)/)[1];
    rdln = parseInt(ri, 10);
    cdln = rdln;
    return '...';

  case line.slice(0, 1) === '-':
    return ' ';

  default:
    rdln += 1;
    cdln = rdln - 1;
    return cdln;
  }
}

function lineClass(line) {
  if (line.slice(0, 2) === '@@') {
    return 'gc';
  }
  if (line.slice(0, 1) === '-') {
    return 'gd';
  }
  if (line.slice(0, 1) === '+') {
    return 'gi';
  }
}

Diff.prototype.asLines = function () {
  var self = this;
  var lines = [];
  self.diff.split('\n').slice(4).forEach(function (line) {

    if (line.slice(0, 1) !== '\\') {
      lines.push({
        text: line,
        ldln: leftDiffLineNumber(0, line),
        rdln: rightDiffLineNumber(0, line),
        class: lineClass(line)
      });
    }

  });
  return lines;
};

module.exports = Diff;
