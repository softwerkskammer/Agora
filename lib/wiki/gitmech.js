"use strict";

var conf = require('nconf');
var workTree = conf.get('wikipath');
var beans = conf.get('beans');
var gitExec = beans.get('gitExec');
var wikiObjects = beans.get('wikiObjects');
var Metadata = wikiObjects.Metadata;

function dataToLines(data) {
  return data.toString().split('\n').filter(function (v) { return v !== ''; });
}

function commit(path, message, author, callback) {
  gitExec.command(['commit', '--author="' + author + '"', '-m', message, path], callback);
}

module.exports = {

  absPath: function (path) {
    return workTree + '/' + path;
  },

  readFile: function (path, version, callback) {
    gitExec.command(['show', version + ':' + path], function (err, data) {
      if (err) { return callback(err); }
      callback(null, data.toString());
    });
  },

  log: function (path, version, howMany, callback) {
    gitExec.command(['log', '-' + howMany, '--no-notes', '--follow', '--pretty=format:%h%n%H%n%an%n%ai%n%s', version, '--', path], function (err, data) {
      if (err) { return callback(err); }
      var logdata = data ? data.toString().split('\n') : [];
      var group;
      var metadata = [];
      var i;
      for (i = Math.floor(logdata.length / 5); i > 0; i = i - 1) {
        group = logdata.slice((i - 1) * 5, i * 5);
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
    gitExec.command(['log', '--since="' + moment.format('MM/DD/YYYY hh:mm:ss') + '"', '--pretty=format:%h%n%H%n%an%n%ai%n%s', '--', path], function (err, data) {
      if (err) { return callback(err); }
      var logdata = data ? data.toString().split('\n') : [];
      var group;
      var metadata = [];
      var i;
      for (i = Math.floor(logdata.length / 5); i > 0; i = i - 1) {
        group = logdata.slice((i - 1) * 5, i * 5);
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
    gitExec.command(['add', path], function (err) {
      if (err) { return callback(err); }
      commit(path, message, author, callback);
    });
  },

  mv: function (oldpath, newpath, message, author, callback) {
    gitExec.command(['mv', oldpath, newpath], function (err) {
      if (err) { return callback(err); }
      gitExec.command(['commit', '--author="' + author + '"', '-m', message], function (err) {
        callback(err);
      });
    });
  },

  rm: function (path, message, author, callback) {
    gitExec.command(['rm', path], function (err) {
      if (err) { return callback(err); }
      commit(path, message, author, callback);
    });
  },

  grep: function (pattern, callback) {
    var args = [ 'grep', '--no-color', '-F', '-n', '-i', '-I', pattern ];
    gitExec.command(args, function (err, data) {
      if (err) { return callback(err); }
      var result = data ? data.toString().split('\n') : [];
      // Search in the file names
      gitExec.command([ 'ls-files', '*' + pattern + '*.md' ], function (err, data) {

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
    gitExec.command([ 'diff', '--no-color', '-b', revisions, '--', path ], function (err, data) {
      callback(err, data.toString());
    });
  },

  ls: function (subdir, callback) {
    gitExec.command([ 'ls-tree', '--name-only', '-r', 'HEAD', subdir ], function (err, data) {
      if (err) { return callback(err); }
      callback(null, dataToLines(data));
    });
  },

  lsdirs: function (callback) {
    if (!workTree) { return callback(null, []); } // to make it run on dev systems
    gitExec.command([ 'ls-tree', '--name-only', '-d', 'HEAD' ], function (err, data) {
      if (err || !data) { return callback(err); }
      callback(null, dataToLines(data));
    });
  },

  lsblogposts: function (groupname, pattern, callback) {
    gitExec.command([ 'ls-files', groupname + '/' + pattern ], function (err, data) {
      if (err) { return callback(err); }
      callback(null, dataToLines(data));
    });
  }
};
