"use strict";

var sinon = require('sinon').sandbox.create();
var expect = require('must');
var beans = require('../../testutil/configureForTest').get('beans');
var Git = beans.get('gitmech');
var gitExec = beans.get('gitExec');

describe('the gitmech module', function () {

  afterEach(function () {
    sinon.restore();
  });

  it('return file contents as string', function (done) {
    var stub = sinon.stub(gitExec, 'command', function (args, callback) {
      if (args[0] === 'show' && args[1] === '1:path') { callback(null, new Buffer('string')); }
    });
    Git.readFile('path', 1, function (err, string) {
      expect(string).to.equal('string');
      done();
    });
  });

});
