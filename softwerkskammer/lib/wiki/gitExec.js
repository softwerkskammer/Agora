'use strict';

var Path = require('path');
var ChildProcess = require('child_process');
var Fs = require('fs');

var conf = require('simple-configure');
var gitCommands = [];
var workTree = conf.get('wikipath');
var gitENOENT = /fatal: (Path '([^']+)' does not exist in '([0-9a-f]{40})'|ambiguous argument '([^']+)': unknown revision or path not in the working tree.)/;

if (workTree) {
  Fs.realpath(workTree, function (err, absWorkTree) {
    workTree = absWorkTree;
    if (err) { throw new Error('Bad repository path (not exists): ' + workTree); }
    var gitDir = Path.join(workTree, '.git');
    Fs.stat(gitDir, function (err1) {
      if (err1) { throw new Error('Bad repository path (not initialized): ' + workTree); }
      gitCommands = ['--git-dir=' + gitDir, '--work-tree=' + workTree];
    });
  });
}

function gitExec(commands, callback) {
  function join(arr) {
    var result, index = 0, length;
    length = arr.reduce(function (l, b) { return l + b.length; }, 0);
    result = new Buffer(length);
    arr.forEach(function (b) {
      b.copy(result, index);
      index += b.length;
    });

    return result;
  }

  var allCommands = gitCommands.concat(commands);
  var child = ChildProcess.spawn('git', allCommands, {cwd: workTree});

  var stdout = [];
  var stderr = [];
  var error = null;
  var exitCode;
  child.stdout.addListener('data', function (text) {
    stdout[stdout.length] = text;
  });
  child.on('error', function (err) {
    if (err.errno === 'ENOENT') {
      error = new Error('The git executable could not be found. It must be installed and in the PATH.');
    }
  });
  child.stderr.addListener('data', function (text) {
    stderr[stderr.length] = text;
  });
  child.addListener('exit', function (code) {
    exitCode = code;
  });
  child.addListener('close', function () {
    if (exitCode > 0) {
      var err = new Error('Exit Code: ' + exitCode + ' git ' + allCommands.join(' ') + '\n' + join(stderr, 'utf8'));
      if (gitENOENT.test(err.message)) {
        err.errno = process.ENOENT;
      }
      if (!/nothing to commit, working directory clean/.test(join(stdout).toString())) {
        return callback(err);
      }
    }
    callback(error, join(stdout));
  });
  child.stdin.end();
}

module.exports = {command: gitExec};
