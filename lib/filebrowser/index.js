"use strict";

var path = require('path');
var winston = require('winston');
var conf = require('nconf').get("filebrowser");
var async = require('async');
var fs = require('fs');

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

module.exports = function (app) {
  var logger = winston.loggers.get('application');
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  app.get(/\/(.*?)\/(.*)/, function (req, res) {
    var root = req.params[0];
    var pathFragment = "";
    var path = "";
    var dirs = [];
    var files = [];
    var content = "";
    var isDirectory = false;
    async.waterfall([
      function calculatePath(next) {
        if (conf && conf[root]) {
          pathFragment = req.params[1];
          path = conf[root] + '/' + pathFragment;
          next();
        }
        else {
          next("unknown root");
        }
      },

      function readFileStats(next) {
        fs.lstat(path, next);
      },

      function readFileContent(stats, next) {
        function processDirContent(err, dirContent) {
          if (err != null) {
            return next(err);
          }

          function processDirEntry(item, next) {
            var entryPath = path + '/' + item;

            function processEntryStats(err, stats) {
              if (err != null) {
                return next(err);
              }
              if (stats.isDirectory()) {
                dirs.push(item);
              }
              else if (stats.isFile()) {
                files.push(item);
              }
              next(null);
            }

            fs.lstat(entryPath, processEntryStats);
          }

          async.each(dirContent, processDirEntry, next);
        }

        function processFileContent(err, data) {
          if (err != null) {
            return next(err);
          }
          content = data;
          next(null);
        }

        if (stats.isDirectory()) {
          isDirectory = true;
          if (pathFragment !== "" && !endsWith(pathFragment, '/')) {
            res.redirect(req.originalUrl + "/");
          }
          else {
            fs.readdir(path, processDirContent);
          }
        }
        else if (stats.isFile()) {
          isDirectory = false;
          fs.readFile(path, 'utf8', processFileContent);
        }
      },

      function render() {
        res.render('filebrowser', {
            root: root,
            path: path,
            pathFragment: pathFragment,
            dirs: dirs,
            files: files,
            content: content,
            isDirectory: isDirectory
          }
        );
      }

    ],
      function (err) {
        if (err != null) {
          logger.error('Error', err);
          res.send(404);
        }
      });
  });
  return app;
};
