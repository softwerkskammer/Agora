'use strict';

const expect = require('must-dist');
const beans = require('../../testutil/configureForTest').get('beans');

const Diff = beans.get('gitDiff');

describe('Git Diff', () => {

  it('formats changes', () => {
    const changesFromConsole = 'diff --git a/crafterswap/index.md b/crafterswap/index.md\n' +
      'index 07ce5cf..1537b92 100644\n' +
      '--- a/crafterswap/index.md\n' +
      '+++ b/crafterswap/index.md\n' +
      '@@ -1,3 +1,14 @@\n' +
      'HiHo!\n' +
      '\n' +
      '### Crafter Swapper\n' +
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
    const diff = new Diff(changesFromConsole);
    const lines = diff.asLines();
    expect(lines.length).to.equal(17);
    expect(lines).to.eql(
      [
        {text: '@@ -1,3 +1,14 @@', ldln: '...', rdln: '...', 'class': 'gc'},
        {text: 'HiHo!', ldln: 0, rdln: 2, 'class': undefined},
        {text: '', ldln: 0, rdln: 4, 'class': undefined},
        {text: '### Crafter Swapper', ldln: 0, rdln: 6, 'class': undefined},
        {text: '+', ldln: '', rdln: 7, 'class': 'gi'},
        {text: '+```javascript', ldln: '', rdln: 8, 'class': 'gi'},
        {text: '+"use strict";', ldln: '', rdln: 9, 'class': 'gi'},
        {text: '+', ldln: '', rdln: 10, 'class': 'gi'},
        {text: '+module.exports = function subdirs(req, res, next) {', ldln: '', rdln: 11, 'class': 'gi'},
        {text: '+  res.locals.wikisubdirs = [];', ldln: '', rdln: 12, 'class': 'gi'},
        {text: '+  next();', ldln: '', rdln: 13, 'class': 'gi'},
        {text: '+};', ldln: '', rdln: 14, 'class': 'gi'},
        {text: '+', ldln: '', rdln: 15, 'class': 'gi'},
        {text: '+```', ldln: '', rdln: 16, 'class': 'gi'},
        {text: '+dodod', ldln: '', rdln: 17, 'class': 'gi'},
        {text: '    ', ldln: 0, rdln: 19, 'class': undefined},
        {text: '', ldln: 0, rdln: 21, 'class': undefined}
      ]
    );

  });

});
