"use strict";
var Fs = require('fs');
var Diff = require('./gitDiff');
var Path = require('path');
var beans = require('nconf').get('beans');
var Git = beans.get('gitmech');
var async = require('async');
var misc = beans.get('misc');
var _ = require("underscore");

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

  pageSave: function (subdir, pageName, body, member, callback) {
    if (!Fs.existsSync(Git.absPath(subdir))) {
      Fs.mkdirSync(Git.absPath(subdir));
    }
    var completePageName = subdir + '/' + pageName;
    var pageFile = Git.absPath(completePageName + '.md');
    Fs.writeFile(pageFile, body.content, function (err) {
      if (err) { return callback(err); }
      Git.log(completePageName + '.md', 'HEAD', 1, function (err, metadata) {
        var conflict = metadata[0] && metadata[0].fullhash !== body.metadata;
        Git.add(completePageName + '.md', (body.comment.length === 0 ? "no comment" : body.comment), member.asGitAuthor(), function () {
          callback(null, conflict);
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
  },

  getBlogpostsForGroup : function (groupname, callback) {
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
  }
};
