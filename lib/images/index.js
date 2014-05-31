'use strict';
var beans = require('nconf').get('beans');
var misc = beans.get('misc');

var app = misc.expressAppIn(__dirname);

var CREATED = 201;

app.post('/', function (req, res, next) {
  var imageId = '8fe5861b-53cb-49db-929f-81eb77b4d05c';

  res.status(CREATED);
  res.location('/images/' + imageId);
  res.end('');
});

module.exports = app;
