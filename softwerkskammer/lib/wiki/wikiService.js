'use strict';
var Fs = require('fs');
var Path = require('path');
var _ = require('lodash');
var eventsToObject = require('./eventsToObject');
var beans = require('simple-configure').get('beans');
var Git = beans.get('gitmech');
var wikiObjects = beans.get('wikiObjects');
var FileWithChangelist = wikiObjects.FileWithChangelist;
var DirectoryWithChangedFiles = wikiObjects.DirectoryWithChangedFiles;
var Diff = beans.get('gitDiff');
var async = require('async');
var logger = require('winston').loggers.get('application');

module.exports = {

  BLOG_ENTRY_FILE_PATTERN: 'blog_*',

  showPage: function (completePageName, pageVersion, callback) {
    Git.readFile(completePageName + '.md', pageVersion, callback);
  },

  pageEdit: function (completePageName, callback) {
    Fs.exists(Git.absPath(completePageName + '.md'), function (exists) {
      if (!exists) {
        return callback(null, '', ['NEW']);
      }
      Git.readFile(completePageName + '.md', 'HEAD', function (err, content) {
        if (err) { return callback(err); }
        Git.log(completePageName + '.md', 'HEAD', 1, function (ignoredErr, metadata) {
          callback(null, content, metadata);
        });
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
    Fs.exists(Git.absPath(subdir), function (exists) {
      if (!exists) {
        Fs.mkdir(Git.absPath(subdir), function (err) {
          if (err) { return callback(err); }
        });
      }
      var completePageName = subdir + '/' + pageName + '.md';
      var pageFile = Git.absPath(completePageName);
      Fs.writeFile(pageFile, body.content, function (err) {
        if (err) { return callback(err); }
        Git.log(completePageName, 'HEAD', 1, function (ignoredErr, metadata) {
          var conflict = metadata[0] && metadata[0].fullhash !== body.metadata;
          Git.add(completePageName, (body.comment.length === 0 ? 'no comment' : body.comment), member.asGitAuthor(), function (err1) {
            callback(err1, conflict);
          });
        });
      });
    });
  },

  pageHistory: function (completePageName, callback) {
    Git.readFile(completePageName + '.md', 'HEAD', function (err) {
      if (err) { return callback(err); }
      Git.log(completePageName + '.md', 'HEAD', 30, function (ignoredErr, metadata) {
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
      if (err) { return callback(err); }
      var result = [];
      items.forEach(function (item) {
        if (item.trim() !== '') {
          var record = item.split(':');
          result.push({
            pageName: record[0].split('.')[0],
            line: record[1],
            text: record.slice(2).join('')
          });
        }
      });
      callback(null, result);
    });
  },

  parseBlogPost: function (path, post) {
    var blogpost = new wikiObjects.Blogpost(path, post);
    return blogpost.isValid() ? blogpost : undefined;
  },

  getBlogpostsForGroup: function (groupname, callback) {
    var self = this;

    Git.lsblogposts(groupname, this.BLOG_ENTRY_FILE_PATTERN, function (err, result) {
      if (err) { return callback(err); }
      if (result.length === 0) { return callback(err, []); }
      async.map(result,
        function (path, mapCallback) {
          Git.readFileFs(path, function (err1, post) {
            if (err1) { return mapCallback(err1); }
            mapCallback(null, self.parseBlogPost(path, post));
          });
        },
        function (err1, unsortedPosts) {
          if (err1) { return callback(err1); }
          var postsSortedByDate = _(unsortedPosts).compact().sortBy(function (post) {
            // _.sortBy is always in ascending order and we want the latest post first, so use negation
            return -post.date().unix();
          }).value();
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
            Git.latestChanges(item.fullname + '.md', moment, function (err1, metadata) {
              if (err1) { return itemsCallback(err1); }
              if (metadata.length > 0) {
                Git.diff(item.fullname + '.md', 'HEAD@{' + moment.toISOString() + '}..HEAD', function (err2, diff) {
                  if (err2) { return itemsCallback(err2); }
                  resultLine.addFile(new FileWithChangelist({
                    file: item.name,
                    changelist: metadata,
                    diff: new Diff(diff)
                  }));
                  itemsCallback();
                });
              } else { itemsCallback(); }
            });
          }, function (err1) {
            if (err1) { logger.error(err1); }
            if (resultLine.files.length > 0) {
              result.push(resultLine);
            }
            directoryCallback();
          });
        });
      }, function (err1) {
        if (err1) {
          logger.error(err1);
          return callback(err1);
        }
        callback(null, result);
      });
    });
  },

  listChangedFilesinDirectory: function (directory, callback) {
    Git.log(directory, 'HEAD', 30, function (ignoredErr, metadata) {
      var datas = _(metadata).uniqBy('name').reject(function (item) { return item.name.match(wikiObjects.BLOG_ENTRY_REGEX); }).value();
      callback(null, datas);
    });
  },

  parseEvents: function (year, callback) {
    Git.readFile('alle/europaweite-veranstaltungen-' + year + '.md', 'HEAD', function (err, contents) {
      callback(null, err ? {} : eventsToObject(contents, year));
    });
  }

};
