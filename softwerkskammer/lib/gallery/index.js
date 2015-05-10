'use strict';
var beans = require('simple-configure').get('beans');
var misc = beans.get('misc');
var galleryService = beans.get('galleryService');

var app = misc.expressAppIn(__dirname);

function sendImage(res, next) {
  return function (err, imagePath) {
    if (err || !imagePath) { return next(err); }
    res.sendFile(imagePath);
  };
}

app.get('/avatarFor/:nickname', function (req, res, next) {
  galleryService.retrieveScaledImage(req.params.nickname, undefined, sendImage(res, next));
});

app.get('/:imageId', function (req, res, next) {
  galleryService.retrieveScaledImage(req.params.imageId, req.query.size, sendImage(res, next));
});

module.exports = app;
