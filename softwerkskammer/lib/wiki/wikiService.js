'use strict';
const Fs = require('fs');
const Path = require('path');
const R = require('ramda');
const eventsToObject = require('./eventsToObject');
const beans = require('simple-configure').get('beans');
const misc = beans.get('misc');
const Git = beans.get('gitmech');
const wikiObjects = beans.get('wikiObjects');
const FileWithChangelist = wikiObjects.FileWithChangelist;
const DirectoryWithChangedFiles = wikiObjects.DirectoryWithChangedFiles;
const Diff = beans.get('gitDiff');
const async = require('async');
const logger = require('winston').loggers.get('application');

module.exports = {

  BLOG_ENTRY_FILE_PATTERN: 'blog_*',

  showPage: function showPage(completePageName, pageVersion, callback) {
    Git.readFile(completePageName + '.md', pageVersion, callback);
  },

  pageEdit: function pageEdit(completePageName, callback) {
    Fs.exists(Git.absPath(completePageName + '.md'), exists => {
      if (!exists) {
        return callback(null, '', ['NEW']);
      }
      Git.readFile(completePageName + '.md', 'HEAD', (err, content) => {
        if (err) { return callback(err); }
        Git.log(completePageName + '.md', 'HEAD', 1, (ignoredErr, metadata) => {
          callback(null, content, metadata);
        });
      });
    });
  },

  pageRename: function pageRename(subdir, pageNameOld, pageNameNew, member, callback) {
    const completePageNameOld = subdir + '/' + pageNameOld + '.md';
    const completePageNameNew = subdir + '/' + pageNameNew + '.md';
    Git.mv(completePageNameOld, completePageNameNew, 'rename: "' + pageNameOld + '" -> "' + pageNameNew + '"', member.asGitAuthor(), err => {
      callback(err, null);
    });
  },

  pageSave: function pageSave(subdir, pageName, body, member, callback) {
    Fs.exists(Git.absPath(subdir), function (exists) {
      if (!exists) {
        Fs.mkdir(Git.absPath(subdir), err => {
          if (err) { return callback(err); }
        });
      }
      const completePageName = subdir + '/' + pageName + '.md';
      const pageFile = Git.absPath(completePageName);
      Fs.writeFile(pageFile, body.content, err => {
        if (err) { return callback(err); }
        Git.log(completePageName, 'HEAD', 1, (ignoredErr, metadata) => {
          const conflict = metadata[0] && metadata[0].fullhash !== body.metadata;
          Git.add(completePageName, (body.comment.length === 0 ? 'no comment' : body.comment), member.asGitAuthor(), err1 => {
            callback(err1, conflict);
          });
        });
      });
    });
  },

  pageHistory: function pageHistory(completePageName, callback) {
    Git.readFile(completePageName + '.md', 'HEAD', err => {
      if (err) { return callback(err); }
      Git.log(completePageName + '.md', 'HEAD', 30, (ignoredErr, metadata) => {
        callback(null, metadata);
      });
    });
  },

  pageCompare: function pageCompare(completePageName, revisions, callback) {
    Git.diff(completePageName + '.md', revisions, (err, diff) => {
      if (err) { return callback(err); }
      callback(null, new Diff(diff));
    });
  },

  pageList: function pageList(subdir, callback) {
    Git.ls(subdir, (err, list) => {
      if (err) { return callback(err); }
      const items = [];
      list.forEach(row => { // FIXME use map instead
        const rowWithoutEnding = row.replace('.md', '');
        items.push({fullname: rowWithoutEnding, name: Path.basename(rowWithoutEnding)});
      });
      callback(null, items);
    });
  },

  search: function search(searchtext, callback) {
    Git.grep(searchtext, (err, items) => {
      if (err) { return callback(err); }
      const result = [];
      items.forEach(item => { // FIXME use map instead
        if (item.trim() !== '') {
          const record = item.split(':');
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

  parseBlogPost: function parseBlogPost(path, post) {
    const blogpost = new wikiObjects.Blogpost(path, post);
    return blogpost.isValid() ? blogpost : undefined;
  },

  getBlogpostsForGroup: function getBlogpostsForGroup(groupname, callback) {
    const self = this;

    Git.lsblogposts(groupname, this.BLOG_ENTRY_FILE_PATTERN, (err, result) => {
      if (err) { return callback(err); }
      if (result.length === 0) { return callback(err, []); }
      async.map(result,
        function (path, mapCallback) {
          Git.readFileFs(path, (err1, post) => {
            if (err1) { return mapCallback(err1); }
            mapCallback(null, self.parseBlogPost(path, post));
          });
        },
        (err1, unsortedPosts) => {
          if (err1) { return callback(err1); }
          const postsSortedByDate = misc.compact(unsortedPosts).sort((a, b) => b.date().unix() - a.date().unix());
          callback(null, postsSortedByDate);
        });
    });
  },

  findPagesForDigestSince: function findPagesForDigestSince(moment, callback) {
    const self = this;
    Git.lsdirs((err, subdirs) => {
      if (err) { return callback(err); }
      const result = [];
      async.eachLimit(subdirs, 5, (directory, directoryCallback) => {
        const resultLine = new DirectoryWithChangedFiles({dir: directory, files: []});
        self.pageList(directory, (listErr, items) => {
          if (listErr) { return directoryCallback(listErr); }
          async.eachLimit(items, 5, function (item, itemsCallback) {
            Git.latestChanges(item.fullname + '.md', moment, (err1, metadata) => {
              if (err1) { return itemsCallback(err1); }
              if (metadata.length > 0) {
                Git.diff(item.fullname + '.md', 'HEAD@{' + moment.toISOString() + '}..HEAD', (err2, diff) => {
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
          }, err1 => {
            if (err1) { logger.error(err1); }
            if (resultLine.files.length > 0) {
              result.push(resultLine);
            }
            directoryCallback();
          });
        });
      }, err1 => {
        if (err1) {
          logger.error(err1);
          return callback(err1);
        }
        callback(null, result);
      });
    });
  },

  listChangedFilesinDirectory: function listChangedFilesinDirectory(directory, callback) {
    Git.log(directory, 'HEAD', 30, (ignoredErr, metadata) => {
      const datas = R.uniqBy(item => item.name, metadata).filter(item => !item.name.match(wikiObjects.BLOG_ENTRY_REGEX));
      callback(null, datas);
    });
  },

  parseEvents: function parseEvents(year, callback) {
    Git.readFile('alle/europaweite-veranstaltungen-' + year + '.md', 'HEAD', (err, contents) => {
      callback(null, err ? {} : eventsToObject(contents, year));
    });
  }

};
