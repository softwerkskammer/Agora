'use strict';
var beans = require('nconf').get('beans');
var magick = require('imagemagick');
var misc = beans.get('misc');
var path = require('path');

var app = misc.expressAppIn(__dirname);
var logger = require('winston').loggers.get('gallery');
var Form = require('multiparty').Form;
var galleryRepository = beans.get('galleryrepositoryService');

var CREATED = 201;
var INTERNAL_SERVER_ERROR = 500;

app.get('/', function (req, res) {
  res.render('index');
});

function orientedFilePath(imageFilePath) {
  var ext = path.extname(imageFilePath);
  return path.dirname(imageFilePath) + '/' + path.basename(imageFilePath, ext) + '.oriented' + ext;
}

function autoOrient(imageFilePath, callback) {
  var orientedImageFilePath = orientedFilePath(imageFilePath);
  logger.debug('Auto-orienting `' + imageFilePath + '\' into `' + orientedImageFilePath + '\'');
  magick.convert([imageFilePath, '-auto-orient', orientedImageFilePath], function (err, stdout) {
    if (err) {
      return callback(err, undefined);
    }
    logger.debug('stdout:', stdout);
    callback(undefined, orientedImageFilePath);
  });
}

app.post('/', function (req, res) {
  new Form().parse(req, function (err, fields, files) {

    function handleFile(file) {
      var imageFilePath = file[0].path;
      autoOrient(imageFilePath, function (err, orientedImageFilePath) {
        if (err) {
          logger.error(err);
          return res.send(INTERNAL_SERVER_ERROR);
        }

        galleryRepository.storeImage(orientedImageFilePath, function (err, imageId) {
          if (err) {
            logger.error(err.message);
            return res.send(INTERNAL_SERVER_ERROR);
          }
          res.status(CREATED);
          res.location(app.path() + imageId);
          res.end();
        });
      });
    }

    var originalFileName;
    for (originalFileName in files) {
      if (files.hasOwnProperty(originalFileName)) {
        handleFile(files[originalFileName]);
      }
    }
  });
});

app.get('/:imageId', function (req, res) {
  galleryRepository.retrieveImage(req.params.imageId, function (err, imagePath) {
    if (err) {
      logger.info(err.message);
      return res.send(404);
    }
    res.sendfile(imagePath);
  });
});

module.exports = app;
