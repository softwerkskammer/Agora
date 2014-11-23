'use strict';
var beans = require('nconf').get('beans');
var misc = beans.get('misc');
var path = require('path');
var _ = require('lodash');
var logger = require('winston').loggers.get('application');
var Form = require('multiparty').Form;
var galleryService = beans.get('galleryService');

var app = misc.expressAppIn(__dirname);

app.get('/:imageId', function (req, res, next) {
  var widths = {thumb: 400, preview: 1080};

  galleryService.retrieveScaledImage(req.params.imageId, widths[req.query.size],
    undefined,
    function sendImage(err, imagePath) {
      if (err) { return next(err); }
      res.sendFile(imagePath);
    });
});

module.exports = app;
