'use strict';
var beans = require('nconf').get('beans');
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

app.post('/', function (req, res) {
  new Form().parse(req, function (err, fields, files) {

    function handleFile(file) {
      var imageFilePath = file[0].path;
      galleryRepository.storeImage(imageFilePath, function (err, imageId) {
        if (err) {
          logger.error(err.message);
          return res.send(INTERNAL_SERVER_ERROR);
        }
        res.status(CREATED);
        res.location(app.path() + imageId);
        res.end();
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
  var sendImage = function (err, imagePath) {
    if (err) {
      logger.info(err.message);
      return res.send(404);
    }
    res.sendfile(imagePath);
  };

  if (req.query.size && 'thumb' === req.query.size) {
    galleryRepository.retrieveScaledImage(req.params.imageId, 400, undefined, sendImage);
  } else if (req.query.size && 'preview' === req.query.size) {
    galleryRepository.retrieveScaledImage(req.params.imageId, 1080, undefined, sendImage);
  } else {
    galleryRepository.retrieveImage(req.params.imageId, sendImage);
  }
});

module.exports = app;
