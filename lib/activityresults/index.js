'use strict';
var beans = require('nconf').get('beans');
var activityresultsService = beans.get('activityresultsService');
var misc = beans.get('misc');

var app = misc.expressAppIn(__dirname);
var logger = require('winston').loggers.get('application');

var NOT_FOUND = 404;


app.get('/', function (req, res) {
  res.render('index');
});

app.get('/:activityResultName', function (req, res) {
  activityresultsService.getActivityResultByName(req.params.activityResultName, function (err, activityResult) {
    if (err) {
      res.status(NOT_FOUND);
      res.render('notFound', {
        createUri: app.path(),
        activityResultName: req.params.activityResultName
      });
    }
  });
});

module.exports = app;
