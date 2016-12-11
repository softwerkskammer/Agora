'use strict';

const Fs = require('fs');
const conf = require('simple-configure');
const workTree = conf.get('wikipath');
const beans = conf.get('beans');
const misc = beans.get('misc');
const gitExec = beans.get('gitExec');
const wikiObjects = beans.get('wikiObjects');
const Metadata = wikiObjects.Metadata;

function dataToLines(data) {
  return data ? data.split('\n').filter(v => v !== '') : [];
}

function esc(arg) { // to secure command line execution
  return '\'' + arg + '\'';
}

function commit(path, message, author, callback) {
  gitExec.command(['commit', '--author=' + esc(author), '-m', esc(message), esc(path)], callback);
}

module.exports = {

  absPath: function absPath(path) {
    return workTree + '/' + path;
  },

  readFileFs: function readFileFs(path, callback) {
    Fs.readFile(this.absPath(path), 'utf8', callback);
  },

  readFile: function readFile(path, version, callback) {
    gitExec.command(['show', version + ':' + esc(path)], callback);
  },

  log: function log(path, version, howMany, callback) {
    gitExec.command(['log', '-' + howMany, '--no-notes', '--follow', '--pretty=format:%h%n%H%n%an%n%ai%n%s', version, '--name-only', '--', esc(path)], (err, data) => {
      if (err) { return callback(err); }
      const logdata = data ? data.split('\n\n') : [];
      const metadata = misc.compact(logdata).map(chunk => {
        const group = chunk.split('\n');
        return new Metadata({
          hashRef: group[0],
          fullhash: group[1],
          author: group[2],
          date: group[3],
          comment: group[4],
          name: group[5]
        });
      });
      if (metadata[0]) {
        metadata[0].hashRef = 'HEAD'; // This can be used linking this version, but needs to be empty for HEAD
      }
      return callback(null, metadata);
    });
  },

  latestChanges: function latestChanges(path, moment, callback) {
    gitExec.command(['log', '--since="' + moment.format('MM/DD/YYYY hh:mm:ss') + '"', '--pretty=format:%h%n%H%n%an%n%ai%n%s', '--', esc(path)], (err, data) => {
      if (err) { return callback(err); }
      const logdata = data ? data.split('\n') : [];
      const metadata = [];
      for (let i = Math.floor(logdata.length / 5); i > 0; i = i - 1) {
        const group = logdata.slice((i - 1) * 5, i * 5);
        metadata.push(new Metadata({
          name: path.replace('.md', ''),
          hashRef: group[0],
          fullhash: group[1],
          author: group[2],
          date: group[3],
          comment: group[4]
        }));
      }
      return callback(null, metadata);
    });
  },

  add: function add(path, message, author, callback) {
    gitExec.command(['add', esc(path)], err => {
      if (err) { return callback(err); }
      return commit(path, message, author, callback);
    });
  },

  mv: function mv(oldpath, newpath, message, author, callback) {
    gitExec.command(['mv', esc(oldpath), esc(newpath)], err => {
      if (err) { return callback(err); }
      return commit('', message, author, callback);
    });
  },

  rm: function rm(path, message, author, callback) {
    gitExec.command(['rm', esc(path)], err => {
      if (err) { return callback(err); }
      return commit(path, message, author, callback);
    });
  },

  grep: function grep(pattern, callback) {
    gitExec.command(['grep', '--no-color', '-F', '-n', '-i', '-I', esc(pattern)], (err, data) => {
      if (err) {
        if (err.message.split('\n').length < 3) {
          return callback(null, []);
        }
        return callback(err);
      }
      const result = data ? data.split('\n') : [];
      // Search in the file names
      return gitExec.command(['ls-files', '*' + esc(pattern) + '*.md'], (err1, data1) => {

        if (data1) {
          data1.split('\n').forEach(name => result.push(name) );
        }

        return callback(err1, result);
      });
    });
  },

  diff: function diff(path, revisions, callback) {
    gitExec.command(['diff', '--no-color', '-b', esc(revisions), '--', esc(path)], callback);
  },

  ls: function ls(subdir, callback) {
    gitExec.command(['ls-tree', '--name-only', '-r', 'HEAD', esc(subdir)], (err, data) => {
      if (err) { return callback(err); }
      return callback(null, dataToLines(data));
    });
  },

  lsdirs: function lsdirs(callback) {
    if (!workTree) { return callback(null, []); } // to make it run on dev systems
    return gitExec.command(['ls-tree', '--name-only', '-d', 'HEAD'], (err, data) => {
      if (err || !data) { return callback(err); }
      return callback(null, dataToLines(data));
    });
  },

  lsblogposts: function lsblogposts(groupname, pattern, callback) {
    gitExec.command(['ls-files', esc(groupname + '/' + pattern)], (err, data) => {
      if (err) { return callback(err); }
      return callback(null, dataToLines(data));
    });
  }
};
