"use strict";
var Fs = require('fs');
var Path = require('path');
var beans = require('nconf').get('beans');
var Git = beans.get('gitmech');
var wikiObjects = beans.get('wikiObjects');
var FileWithChangelist = wikiObjects.FileWithChangelist;
var DirectoryWithChangedFiles = wikiObjects.DirectoryWithChangedFiles;
var Diff = beans.get('gitDiff');
var async = require('async');
var misc = beans.get('misc');
var _ = require("lodash");
var logger = require('winston').loggers.get('application');

module.exports = {

  showPage: function (completePageName, pageVersion, callback) {
    Git.readFile(completePageName + '.md', pageVersion, function (err, content) {
      if (err) { return callback(err); }
      callback(null, content);
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

  pageRename: function (subdir, pageNameOld, pageNameNew, member, callback) {
    var completePageNameOld = subdir + '/' + pageNameOld + '.md';
    var completePageNameNew = subdir + '/' + pageNameNew + '.md';
    Git.mv(completePageNameOld, completePageNameNew, 'rename: "' + pageNameOld + '" -> "' + pageNameNew + '"', member.asGitAuthor(), function (err) {
      callback(err, null);
    });
  },
  
  pageSave: function (subdir, pageName, body, member, callback) {
    if (!Fs.existsSync(Git.absPath(subdir))) {
      Fs.mkdirSync(Git.absPath(subdir));
    }
    var completePageName = subdir + '/' + pageName + '.md';
    var pageFile = Git.absPath(completePageName);
    Fs.writeFile(pageFile, body.content, function (err) {
      if (err) { return callback(err); }
      Git.log(completePageName, 'HEAD', 1, function (err, metadata) {
        var conflict = metadata[0] && metadata[0].fullhash !== body.metadata;
        Git.add(completePageName, (body.comment.length === 0 ? "no comment" : body.comment), member.asGitAuthor(), function (err) {
          callback(err, conflict);
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
      items.forEach(function (item) {
        if (item.trim() !== "") {
          var record = item.split(":");
          result.push({
            pageName: record[0].split(".")[0],
            line: record[1],
            text: record.slice(2).join('')
          });
        }
      });
      callback(null, result);
    });
  },

  getBlogpostsForGroup: function (groupname, callback) {
    Git.lsblogposts(groupname, function (err, result) {
      if (err) { return callback(err); }

      if (result.length === 0) {
        return callback(err, []);
      }

      async.map(result,
        function (path, mapCallback) {
          Git.readFile(path, 'HEAD', function (err, rawPost) {
            if (err) { return mapCallback(err); }

            var parsedPost = misc.parseBlogPost(rawPost);
            if (parsedPost !== undefined) {
              parsedPost.path = path.substring(0, path.length - 3);
            }
            mapCallback(null, parsedPost);
          });
        },
        function (err, unsortedPosts) {
          if (err) { return callback(err); }

          var postsWithoutUndefined = _.filter(unsortedPosts, function (post) {
            return post !== undefined;
          });

          var postsSortedByDate = _.sortBy(postsWithoutUndefined, function (post) {
            if (!post.date.isValid()) {
              return Number.MAX_VALUE;
            }
            // _.sortBy is always in ascending order and we want the latest post first, so use negation
            return -post.date.unix();
          });
          callback(null, postsSortedByDate);
        });
    });
  },

  findPagesForDigestSince: function (moment, callback) {
    var self = this;
    Git.lsdirs(function (err, subdirs) {
      if (err) { return callback(err); }
      var result = [];
      async.each(subdirs, function (directory, directoryCallback) {
        var resultLine = new DirectoryWithChangedFiles({dir: directory, files: []});
        self.pageList(directory, function (listErr, items) {
          if (listErr) { return directoryCallback(listErr); }
          async.each(items, function (item, itemsCallback) {
            Git.latestChanges(item.fullname + '.md', moment, function (err, metadata) {
              if (err) { return itemsCallback(err); }
              if (metadata.length > 0) {
                Git.diff(item.fullname + '.md', 'HEAD@{' + moment.toISOString() + '}..HEAD', function (err, diff) {
                  if (err) { return itemsCallback(err); }
                  resultLine.addFile(new FileWithChangelist({file: item.name, changelist: metadata, diff: new Diff(diff)}));
                  itemsCallback();
                });
              } else { itemsCallback(); }
            });
          }, function (err) {
            if (err) { logger.error(err); }
            if (resultLine.files.length > 0) {
              result.push(resultLine);
            }
            directoryCallback();
          });
        });
      }, function (err) {
        if (err) { logger.error(err); }
        callback(null, result);
      });
    });
  }

};
