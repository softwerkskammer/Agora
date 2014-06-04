'use strict';
var beans = require('nconf').get('beans');
var misc = beans.get('misc');

var app = misc.expressAppIn(__dirname);
var logger = require('winston').loggers.get('application');
var Form = require('multiparty').Form;
var imageRepository = beans.get('imagerepositoryAPI');

var CREATED = 201;
var INTERNAL_SERVER_ERROR = 500;

app.get('/', function (req, res) {
  res.render('index');
});

app.post('/', function (req, res) {
  new Form().parse(req, function (err, fields, files) {

    function handleFile(file) {
      imageRepository.storeImage(file[0].path, function (err, imageId) {
        if (err) {
          logger.error(err.message);
          return res.send(INTERNAL_SERVER_ERROR);
        }
        res.status(CREATED);
        res.location('/images/' + imageId);
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
  imageRepository.retrieveImage(req.params.imageId, function (err, imagePath) {
    if (err) {
      logger.info(err.message);
      return res.send(404);
    }
    res.sendfile(imagePath);
  });
});

module.exports = app;
