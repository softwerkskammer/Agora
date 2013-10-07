"use strict";

var Path = require('path');
var ChildProcess = require('child_process');
var Fs = require('fs');

module.exports = function () {
  var conf = require('nconf');
  var gitCommands;
  var workTree = conf.get('wikipath');
  var gitENOENT = /fatal: (Path '([^']+)' does not exist in '([0-9a-f]{40})'|ambiguous argument '([^']+)': unknown revision or path not in the working tree.)/;

  if (workTree) {
    try {
      Fs.statSync(workTree);
    } catch (e) {
      throw new Error('Bad repository path (not exists): ' + workTree);
    }

    try {
      var gitDir = Path.join(workTree, '.git');
      Fs.statSync(gitDir);
      gitCommands = ['--git-dir=' + gitDir, '--work-tree=' + workTree];
    } catch (e) {
      throw new Error('Bad repository path (not initialized): ' + workTree);
    }
  }
  // Internal helper to talk to the git subprocess
  function gitExec(commands, callback) {
    commands = gitCommands.concat(commands);
    var child = ChildProcess.spawn('git', commands, { cwd: workTree });

    var stdout = [];
    var stderr = [];
    var exitCode;
    child.stdout.addListener('data', function (text) {
      stdout[stdout.length] = text;
    });
    child.stderr.addListener('data', function (text) {
      stderr[stderr.length] = text;
    });
    child.addListener('exit', function (code) {
      exitCode = code;
    });
    child.addListener('close', function () {
      if (exitCode > 0) {
        var err = new Error('git ' + commands.join(' ') + '\n' + join(stderr, 'utf8'));
        if (gitENOENT.test(err.message)) {
          err.errno = process.ENOENT;
        }
        return callback(err);
      }
      callback(null, join(stdout));
    });
    child.stdin.end();
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

  return {

    // FIXME: shouldPush should be a method which understands if the local repo is in sync with the remote
    // BY default we assume the repo is dirty and needs a push
    // git rev-list master...origin/master (if the output is empty, there is no need for a push)
    shouldPush: true,

    absPath: function (path) {
      return workTree + '/' + path;
    },

    readFile: function (path, version, callback) {
      gitExec(['show', version + ':' + path], function (err, data) {
        if (err) {
          callback(err);
        } else {
          callback(null, data.toString());
        }
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
            callback('Push unsucessfull (' + lines[1] + ')');
            return;
          }
          this.shouldPush = false;
          callback(null);
        });

      });
    },

    log: function (path, version, howMany, callback) {
      gitExec(['log', '-' + howMany, '--reverse', '--no-notes', '--pretty=format:%h%n%H%n%an%n%ai%n%ar%n%s', version, '--', path], function (err, data) {
        var logdata = data ? data.toString().split('\n') : [];
        var group;
        var metadata = [];
        for (var i = Math.floor(logdata.length / 6); i-- > 0;) {
          group = logdata.slice(i * 6, (i + 1) * 6);
          metadata.push({
            name: path.replace('.md', ''),
            hashRef: group[0],
            fullhash: group[1],
            author: group[2],
            date: group[3],
            relDate: group[4],
            subject: group[5]
          });
        }
        if (metadata[0]) {
          metadata[0].hashRef = 'HEAD'; // This can be used linking this version, but needs to be empty for HEAD
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
      // TODO decide for -w
      var args = [ 'grep', '--no-color', '-F', '-n', '-i', '-I', pattern ];
      gitExec(args, function (err, data) {

        var result;
        if (data) {
          result = data.toString().split('\n');
        } else {
          result = [];
        }

        // Search in the file names
        gitExec([ 'ls-files', '*' + pattern + '*.md' ], function (err, data) {

          if (data) {
            data.toString().split('\n').forEach(function (name) {
              result.push(Path.basename(name));
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
        callback(null, data.toString().split('\n').filter(function (v) {
          return v !== '';
        }));
      });
    },

    lsdirs: function (callback) {
      if (!workTree) {
        return callback(null, []);
      }
      gitExec([ 'ls-tree', '--name-only', '-d', 'HEAD' ], function (err, data) {
        callback(null, data.toString().split('\n').filter(function (v) {
          return v !== '';
        }));
      });
    }
  };

};
