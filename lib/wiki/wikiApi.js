"use strict";
var Fs = require('fs');
var Git = require('./gitmech')('/JavascriptDev/Agora-Wiki');
var Locker = require('./locker');
var Diff = require('./gitDiff');

module.exports = {

  pageShow: function (pageName, pageVersion, callback) {
    var pageNameWithoutColons = pageName.replace(/:/, '/');

    Git.readFile(pageNameWithoutColons + ".md", pageVersion, function (err, content) {
      if (err) { return callback(err); }
      Git.log(pageNameWithoutColons + ".md", pageVersion, 1, function (err, metadata) {
        callback(null, content, metadata);
      });
    });
  },

  pageEdit: function (pageName, user, callback) {
    var lock = Locker.getLock(pageName);
    var lockWarning;
    if (lock) {
      if (lock.user !== user) {
        lockWarning = "Warning: this page is probably being edited by " + lock.user;
      }
    }
    var pageNameWithoutColons = pageName.replace(/:/, '/');
    Git.readFile(pageNameWithoutColons + ".md", "HEAD", function (err, content) {
      if (err) { return callback(err); }
      Locker.lock(pageName, user);
      callback(null, content, lockWarning);
    });
  },

  pageNew: function (pageName, callback) {
    var pageNameWithoutColons = pageName.replace(/:/, '/');
    if (Fs.existsSync(Git.absPath(pageNameWithoutColons + ".md"))) {
      return callback(new Error('File exists'));
    }
    callback();
  },

  pageSave: function (pageName, content, commitMessage, user, callback) {
    var pageNameWithoutColons = pageName.replace(/:/, '/');
    var pageFile = Git.absPath(pageNameWithoutColons + ".md");
    Fs.writeFile(pageFile, content, function (err) {
      if (err) { return callback(err); }
      Git.add(pageNameWithoutColons + ".md", commitMessage || "no commit message", user.member.asGitAuthor(), function () {
        Locker.unlock(pageName);
        callback();
      });
    });
  },

  pageHistory: function (pageName, callback) {
    Git.readFile(pageName + ".md", "HEAD", function (err) {
      if (err) { return callback(err); }

      Git.log(pageName + ".md", "HEAD", 30, function (err, metadata) {
        callback(null, metadata);
      });
    });
  },

  pageCompare: function (pageName, revisions, callback) {
    Git.diff(pageName + ".md", revisions, function (err, diff) {
      if (err) { return callback(err); }
      callback(null, new Diff(diff));
    });
  }
};
