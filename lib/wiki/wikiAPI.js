"use strict";
var Fs = require('fs');
var Git = require('./gitmech')('/JavascriptDev/Agora-Wiki');
var Locker = require('./locker');
var Diff = require('./gitDiff');

module.exports = {

  pageShow: function (subdir, pageName, pageVersion, callback) {
    var completePageName = subdir + '/' + pageName;
    Git.readFile(completePageName + ".md", pageVersion, function (err, content) {
      if (err) { return callback(err); }
      Git.log(completePageName + ".md", pageVersion, 1, function (err, metadata) {
        callback(null, content, metadata);
      });
    });
  },

  pageEdit: function (subdir, pageName, user, callback) {
    var completePageName = subdir + '/' + pageName;
    var lock = Locker.getLock(completePageName);
    var lockWarning;
    if (lock) {
      if (lock.user !== user) {
        lockWarning = "Warning: this page is probably being edited by " + lock.user;
      }
    }
    Git.readFile(completePageName + ".md", "HEAD", function (err, content) {
      if (err) { return callback(err); }
      Locker.lock(completePageName, user);
      callback(null, content, lockWarning);
    });
  },

  pageNew: function (subdir, pageName, callback) {
    var completePageName = subdir + '/' + pageName;
    if (Fs.existsSync(Git.absPath(completePageName + ".md"))) {
      return callback(new Error('File exists'));
    }
    callback();
  },

  pageSave: function (subdir, pageName, content, commitMessage, user, callback) {
    var completePageName = subdir + '/' + pageName;
    var pageFile = Git.absPath(completePageName + ".md");
    if (!Fs.existsSync(Git.absPath(subdir))) {
      Fs.mkdir(Git.absPath(subdir));
    }
    Fs.writeFile(pageFile, content, function (err) {
      if (err) { return callback(err); }
      Git.add(completePageName + ".md", commitMessage || "no commit message", user.member.asGitAuthor(), function () {
        Locker.unlock(completePageName);
        callback();
      });
    });
  },

  pageHistory: function (subdir, pageName, callback) {
    var completePageName = subdir + '/' + pageName;
    Git.readFile(completePageName + ".md", "HEAD", function (err) {
      if (err) { return callback(err); }

      Git.log(completePageName + ".md", "HEAD", 30, function (err, metadata) {
        callback(null, metadata);
      });
    });
  },

  pageCompare: function (subdir, pageName, revisions, callback) {
    var completePageName = subdir + '/' + pageName;
    Git.diff(completePageName + ".md", revisions, function (err, diff) {
      if (err) { return callback(err); }
      callback(null, new Diff(diff));
    });
  }
};
