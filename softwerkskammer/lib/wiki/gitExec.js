'use strict';

var Path = require('path');
var ChildProcess = require('child_process');
var Fs = require('fs');

var conf = require('simple-configure');
var gitCommands = [];
var workTree = conf.get('wikipath');

if (workTree) {
  Fs.realpath(workTree, function (err, absWorkTree) {
      if (err) { throw new Error('Repository path does not exist: ' + workTree); }
      workTree = absWorkTree;
      var gitDir = Path.join(workTree, '.git');
      Fs.stat(gitDir, function (err1) {
        if (err1) { throw new Error('Repository path is not initialized: ' + workTree); }
        gitCommands = ['--git-dir=' + gitDir, '--work-tree=' + workTree];
        // run a smoke test of git and the repo:
        ChildProcess.exec('git log -1 --oneline ', {cwd: workTree}, (err2) => {
          if (err2) {
            if (/fatal: your current branch 'master' does not have any commits yet/.test(err2.message)) {
              throw new Error('Please add an initial commit to the repository: ' + workTree);
            }
            throw new Error(err2.message + ' in ' + workTree);
          }
        });
      });
    }
  );
}

function gitExec(commands, callback) {
  ChildProcess.exec('git ' + gitCommands.concat(commands).join(' '), {cwd: workTree}, callback);
}

module.exports = {command: gitExec};
