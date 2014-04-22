/*jslint regexp: true*/
"use strict";

var Path = require('path');
var ChildProcess = require('child_process');
var Fs = require('fs');

var conf = require('nconf');
var gitCommands = [];
var workTree = conf.get('wikipath');
var wikiObjects = conf.get('beans').get('wikiObjects');
var Metadata = wikiObjects.Metadata;
var gitENOENT = /fatal: (Path '([^']+)' does not exist in '([0-9a-f]{40})'|ambiguous argument '([^']+)': unknown revision or path not in the working tree.)/;

if (workTree) {
  Fs.stat(workTree, function (err) {
    if (err) { throw new Error('Bad repository path (not exists): ' + workTree); }
    var gitDir = Path.join(workTree, '.git');
    Fs.stat(gitDir, function (err) {
      if (err) { throw new Error('Bad repository path (not initialized): ' + workTree); }
      gitCommands = ['--git-dir=' + gitDir, '--work-tree=' + workTree];
    });
  });
}

function join(arr) {
  var result, index = 0, length;
  length = arr.reduce(function (l, b) {
    return l + b.length;
  }, 0);
  result = new Buffer(length);
  arr.forEach(function (b) {
    b.copy(result, index);
    index += b.length;
  });

  return result;
}

// Internal helper to talk to the git subprocess
function gitExec(commands, callback) {
  commands = gitCommands.concat(commands);
  var child = ChildProcess.spawn('git', commands, { cwd: workTree });

  var stdout = [];
  var stderr = [];
  var error = null;
  var exitCode;
  child.stdout.addListener('data', function (text) {
    stdout[stdout.length] = text;
  });
  child.on('error', function (err) {
    if (err.errno === "ENOENT") {
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
      var err = new Error('Exit Code: ' + exitCode + ' git ' + commands.join(' ') + '\n' + join(stderr, 'utf8'));
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

function dataToLines(data) {
  return data.toString().split('\n').filter(function (v) { return v !== ''; });
}

module.exports = {

  // FIXME: shouldPush should be a method which understands if the local repo is in sync with the remote
  // BY default we assume the repo is dirty and needs a push
  // git rev-list master...origin/master (if the output is empty, there is no need for a push)
  shouldPush: true,

  absPath: function (path) {
    return workTree + '/' + path;
  },

  readFile: function (path, version, callback) {
    gitExec(['show', version + ':' + path], function (err, data) {
      if (err) { return callback(err); }
      callback(null, data.toString());

    });
  },

  remoteExists: function (remote, callback) {
    gitExec(['remote'], function (err, data) {
      var remotes = (data ? data.toString().split('\n') : []);
      callback(null, remotes.indexOf(remote) !== -1);
    });
  },

  push: function (remote, refspec, callback) {
    // No commits, no push
    if (!this.shouldPush) {
      callback(null);
      return;
    }

    this.remoteExists(remote, function (err, exists) {
      if (!exists) {
        callback('Remote does not exist ' + '(' + remote + ')');
        return;
      }

      gitExec(['push', remote, refspec], function (err) {
        if (err && err.toString().match(/^Error:/)) {
          var lines = err.toString().split('\n');
          callback('Push unsuccessful (' + lines[1] + ')');
          return;
        }
        this.shouldPush = false;
        callback(null);
      });

    });
  },

  log: function (path, version, howMany, callback) {
    gitExec(['log', '-' + howMany, '--no-notes', '--follow', '--pretty=format:%h%n%H%n%an%n%ai%n%s', version, '--', path], function (err, data) {
      var logdata = data ? data.toString().split('\n') : [];
      var group;
      var metadata = [];
      var i = Math.floor(logdata.length / 5);
      for (i; i > 0; i = i - 1) {
        group = logdata.slice(i * 5, (i + 1) * 5);
        metadata.unshift(new Metadata({
          name: path.replace('.md', ''),
          hashRef: group[0],
          fullhash: group[1],
          author: group[2],
          date: group[3],
          comment: group[4]
        }));
      }
      if (metadata[0]) {
        metadata[0].hashRef = 'HEAD'; // This can be used linking this version, but needs to be empty for HEAD
      }
      callback(null, metadata);
    });
  },

  latestChanges: function (path, moment, callback) {
    gitExec(['log', '--since="' + moment.format('MM/DD/YYYY hh:mm:ss') + '"', '--pretty=format:%h%n%H%n%an%n%ai%n%s', '--', path], function (err, data) {
      var logdata = data ? data.toString().split('\n') : [];
      var group;
      var metadata = [];
      var i = Math.floor(logdata.length / 5);
      for (i; i > 0; i = i - 1) {
        group = logdata.slice(i * 5, (i + 1) * 5);
        metadata.push(new Metadata({
          name: path.replace('.md', ''),
          hashRef: group[0],
          fullhash: group[1],
          author: group[2],
          date: group[3],
          comment: group[4]
        }));
      }
      callback(null, metadata);
    });
  },

  add: function (path, message, author, callback) {
    gitExec(['add', path], function (err) {
      if (err) {
        callback(err);
      } else {
        this.commit(path, message, author, callback);
      }
    }.bind(this));
  },

  mv: function (oldpath, newpath, message, author, callback) {
    gitExec(['mv', oldpath, newpath], function (err) {
      if (err) {
        callback(err);
      } else {
        gitExec(['commit', '--author="' + author + '"', '-m', message], function (err) {
          callback(err);
        });
      }
    }.bind(this));
  },

  rm: function (path, message, author, callback) {
    gitExec(['rm', path], function (err) {
      if (err) {
        callback(err);
      } else {
        this.commit(path, message, author, callback);
      }
    }.bind(this));
  },

  commit: function (path, message, author, callback) {
    gitExec(['commit', '--author="' + author + '"', '-m', message, path], function (err) {
      this.shouldPush = true;
      callback(err);
    }.bind(this));
  },

  grep: function (pattern, callback) {
    var args = [ 'grep', '--no-color', '-F', '-n', '-i', '-I', pattern ];
    gitExec(args, function (err, data) {
      var result = data ? data.toString().split('\n') : [];
      // Search in the file names
      gitExec([ 'ls-files', '*' + pattern + '*.md' ], function (err, data) {

        if (data) {
          data.toString().split('\n').forEach(function (name) {
            result.push(name);
          });
        }

        callback(err, result);
      });
    });
  },

  diff: function (path, revisions, callback) {
    gitExec([ 'diff', '--no-color', '-b', revisions, '--', path ], function (err, data) {
      callback(err, data.toString());
    });
  },

  ls: function (subdir, callback) {
    gitExec([ 'ls-tree', '--name-only', '-r', 'HEAD', subdir ], function (err, data) {
      callback(null, dataToLines(data));
    });
  },

  lsdirs: function (callback) {
    if (!workTree) { return callback(null, []); }
    gitExec([ 'ls-tree', '--name-only', '-d', 'HEAD' ], function (err, data) {
      if (err || !data) { return callback(err); }
      callback(null, dataToLines(data));
    });
  },

  lsblogposts: function (groupname, pattern, callback) {
    gitExec([ 'ls-files', groupname + '/' + pattern ], function (err, data) {
      callback(null, dataToLines(data));
    });
  }
};
