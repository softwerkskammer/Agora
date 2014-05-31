'use strict';
var beans = require('nconf').get('beans');
var misc = beans.get('misc');

var app = misc.expressAppIn(__dirname);
var Form = require('multiparty').Form;
var imageRepository = beans.get('imagerepositoryAPI');

var CREATED = 201;
var INTERNAL_SERVER_ERROR = 500;

app.post('/', function (req, res) {
  new Form().parse(req, function (err, fields, files) {

    function handleFile(file) {
      imageRepository.storeImage(file[0].path, function (err, imageId) {
        if (err) {
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

module.exports = app;
