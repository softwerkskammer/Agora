'use strict';
var beans = require('nconf').get('beans');
var misc = beans.get('misc');

var app = misc.expressAppIn(__dirname);
var imageRepository = beans.get('imagerepositoryAPI');

var CREATED = 201;

app.post('/', function (req, res, next) {
  imageRepository.storeImage('', function (err, imageId) {
    res.status(CREATED);
    res.location('/images/' + imageId);
    res.end('');
  });
});

module.exports = app;
