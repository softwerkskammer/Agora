'use strict';
var beans = require('nconf').get('beans');
var misc = beans.get('misc');
var path = require('path');
var _ = require('lodash');
var app = misc.expressAppIn(__dirname);
var logger = require('winston').loggers.get('application');
var Form = require('multiparty').Form;
var galleryService = beans.get('galleryService');

var CREATED = 201;

app.get('/', function (req, res) {
  res.render('index');
});

app.post('/', function (req, res, next) {
  new Form().parse(req, function (err, fields, files) {

    function handleFile(file) {
      var imageFilePath = file[0].path;
      galleryService.storeImage(imageFilePath, function (err, imageId) {
        if (err) {
          logger.error(err.message);
          return next(err);
        }
        res.status(CREATED);
        res.location(app.path() + imageId);
        res.end();
      });
    }

    _.forEach(files, handleFile);
  });
});

app.get('/:imageId', function (req, res, next) {
  function sendImage(err, imagePath) {
    if (err) { return next(err); }
    res.sendFile(imagePath);
  }

  var id = req.params.imageId;
  var size = req.query.size;

  if ('thumb' === size) {
    galleryService.retrieveScaledImage(id, 400, undefined, sendImage);
  } else if ('preview' === size) {
    galleryService.retrieveScaledImage(id, 1080, undefined, sendImage);
  } else {
    galleryService.retrieveScaledImage(id, undefined, undefined, sendImage);
  }
});

module.exports = app;
