class Diff {
  constructor(diffString) {
    this.diff = diffString;
  }

  asLines() {
    let ldln = 0;
    let rdln = 0;

    function leftDiffLineNumber(id, line) {
      if (line.slice(0, 2) === '@@') {
        const li = line.match(/-(\d+)/)[1];
        ldln = parseInt(li, 10);
        return '...';
      }
      if (line.slice(0, 1) === '+') {
        return '';
      }
      rdln = rdln + 1;
      return ldln - 1;
    }

    function rightDiffLineNumber(id, line) {
      if (line.slice(0, 2) === '@@') {
        const ri = line.match(/\+(\d+)/)[1];
        rdln = parseInt(ri, 10);
        return '...';
      }
      if (line.slice(0, 1) === '-') {
        return ' ';
      }
      rdln = rdln + 1;
      return rdln - 1;
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

    const lines = [];
    this.diff.split('\n').slice(4).forEach(function (line) {
      if (line.slice(0, 1) !== '\\') {
        lines.push({
          text: line,
          ldln: leftDiffLineNumber(0, line),
          rdln: rightDiffLineNumber(0, line),
          'class': lineClass(line)
        });
      }
    });
    return lines;
  }
}

module.exports = Diff;
