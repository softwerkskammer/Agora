"use strict";

var expect = require('chai').expect;
var beans = require('../../testutil/configureForTest').get('beans');

var Diff = beans.get('gitDiff');

describe('Git Diff', function () {

  it('formats changes', function () {
    var changesFromConsole = 'diff --git a/craftsmanswap/index.md b/craftsmanswap/index.md\n' +
      'index 07ce5cf..1537b92 100644\n' +
      '--- a/craftsmanswap/index.md\n' +
      '+++ b/craftsmanswap/index.md\n' +
      '@@ -1,3 +1,14 @@\n' +
      'HiHo!\n' +
      '\n' +
      '### Craftsman Swapper\n' +
      '+\n' +
      '+```javascript\n' +
      '+"use strict";\n' +
      '+\n' +
      '+module.exports = function subdirs(req, res, next) {\n' +
      '+  res.locals.wikisubdirs = [];\n' +
      '+  next();\n' +
      '+};\n' +
      '+\n' +
      '+```\n' +
      '+dodod\n' +
      '\\ No newline at end of file\n    ' +
      '\n';
    var diff = new Diff(changesFromConsole);
    var lines = diff.asLines();
    console.log(lines);
    expect(lines.length).to.equal(17);
    expect(lines).to.contain({text: '@@ -1,3 +1,14 @@', ldln: '...', rdln: '...', 'class': 'gc'});
    expect(lines).to.contain({text: 'HiHo!', ldln: 0, rdln: 2, 'class': undefined});
    expect(lines).to.contain({ text: '', ldln: 0, rdln: 4, 'class': undefined });
    expect(lines).to.contain({ text: '### Craftsman Swapper', ldln: 0, rdln: 6, 'class': undefined });
    expect(lines).to.contain({ text: '+', ldln: '', rdln: 7, 'class': 'gi' });
    expect(lines).to.contain({ text: '+```javascript', ldln: '', rdln: 8, 'class': 'gi' });
    expect(lines).to.contain({ text: '+"use strict";', ldln: '', rdln: 9, 'class': 'gi' });
    expect(lines).to.contain({ text: '+', ldln: '', rdln: 10, 'class': 'gi' });
    expect(lines).to.contain({ text: '+module.exports = function subdirs(req, res, next) {', ldln: '', rdln: 11, 'class': 'gi' });
    expect(lines).to.contain({ text: '+  res.locals.wikisubdirs = [];', ldln: '', rdln: 12, 'class': 'gi' });
    expect(lines).to.contain({ text: '+  next();', ldln: '', rdln: 13, 'class': 'gi' });
    expect(lines).to.contain({ text: '+};', ldln: '', rdln: 14, 'class': 'gi' });
    expect(lines).to.contain({ text: '+', ldln: '', rdln: 15, 'class': 'gi' });
    expect(lines).to.contain({ text: '+```', ldln: '', rdln: 16, 'class': 'gi' });
    expect(lines).to.contain({ text: '+dodod', ldln: '', rdln: 17, 'class': 'gi' });
    expect(lines).to.contain({ text: '    ', ldln: 0, rdln: 19, 'class': undefined });
    expect(lines).to.contain({ text: '', ldln: 0, rdln: 21, 'class': undefined });
  });

});
