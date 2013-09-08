"use strict";
var Fs = require('fs');
var Diff = require('./gitDiff');
var Path = require('path');
var beans = require('nconf').get('beans');
var Git = beans.get('gitmech')();
var statusmessage = beans.get('statusmessage');

module.exports = {

  pageShow: function (completePageName, pageVersion, callback) {
    Git.readFile(completePageName + '.md', pageVersion, function (err, content) {
      if (err) { return callback(err); }
      Git.log(completePageName + '.md', pageVersion, 1, function (err, metadata) {
        callback(null, content, metadata);
      });
    });
  },

  pageEdit: function (completePageName, callback) {
    if (!Fs.existsSync(Git.absPath(completePageName + '.md'))) {
      return callback(null, '', ['NEW']);
    }
    Git.readFile(completePageName + '.md', 'HEAD', function (err, content) {
      if (err) { return callback(err); }
      Git.log(completePageName + '.md', 'HEAD', 1, function (err, metadata) {
        callback(null, content, metadata);
      });
    });
  },

  pageSave: function (subdir, pageName, body, user, callback) {
    if (!Fs.existsSync(Git.absPath(subdir))) {
      Fs.mkdirSync(Git.absPath(subdir));
    }
    var completePageName = subdir + '/' + pageName;
    var pageFile = Git.absPath(completePageName + '.md');
    Fs.writeFile(pageFile, body.content, function (err) {
      if (err) { return callback(err); }
      var message = statusmessage.successMessage('Speichern erfolgreich', 'Deine Änderungen wurden gespeichert.');
      Git.log(completePageName + '.md', 'HEAD', 1, function (err, metadata) {
        if (metadata[0] && metadata[0].fullhash !== body.metadata) {
          message = statusmessage.errorMessage('Speicherkonflikt', 'Deine Änderungen wurden gespeichert. ' +
            'Du hast allerdings Änderungen eines anderen Benutzers überschrieben. ' +
            'Bitte überprüfe nochmals die Wikiseite.');
        }
        Git.add(completePageName + '.md', body.commitMessage, user.member.asGitAuthor(), function () {
          callback(null, message);
        });
      });
    });
  },

  pageHistory: function (completePageName, callback) {
    Git.readFile(completePageName + '.md', 'HEAD', function (err) {
      if (err) { return callback(err); }
      Git.log(completePageName + '.md', 'HEAD', 30, function (err, metadata) {
        callback(null, metadata);
      });
    });
  },

  pageCompare: function (completePageName, revisions, callback) {
    Git.diff(completePageName + '.md', revisions, function (err, diff) {
      if (err) { return callback(err); }
      callback(null, new Diff(diff));
    });
  },

  pageList: function (subdir, callback) {
    Git.ls(subdir, function (err, list) {
      if (err) { return callback(err); }
      var items = [];
      list.forEach(function (row) {
        var rowWithoutEnding = row.replace('.md', '');
        items.push({fullname: rowWithoutEnding, name: Path.basename(rowWithoutEnding)});
      });
      callback(null, items);
    });
  },

  search: function (searchtext, callback) {
    Git.grep(searchtext, function (err, items) {
      if (err) {callback(err); }
      var result = [];
      console.log(items);
      items.forEach(function (item) {
        if (item.trim() !== "") {
          var record = item.split(":");
          result.push({
            pageName: record[0].split(".")[0],
            line: record[1] ? record[1] : "",
            text: record.slice(2).join('')
          });
        }
      });
      callback(null, result);
    });
  }
};
