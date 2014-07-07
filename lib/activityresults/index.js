'use strict';
var beans = require('nconf').get('beans');
var activityresultsService = beans.get('activityresultsService');
var misc = beans.get('misc');

var app = misc.expressAppIn(__dirname);
var logger = require('winston').loggers.get('application');

var CREATED = 201;

var BAD_REQUEST = 400;
var NOT_FOUND = 404;


app.post('/', function (req, res) {
  var activityResultName = req.body.activityResultName;
  if (!activityResultName) {
    return res.send(BAD_REQUEST);
  }
  // TODO Save the new activityResult
  res.location(app.path() + activityResultName);
  res.send(CREATED);
});

app.get('/:activityResultName', function (req, res) {
  activityresultsService.getActivityResultByName(req.params.activityResultName, function (err, activityResult) {
    if (err || !activityResult) {
      res.status(NOT_FOUND);
      return res.render('notFound', {
        createUri: app.path(),
        activityResultName: req.params.activityResultName
      });
    }

    res.render('get', {
      activityResultName: activityResult.id
    });
  });
});

module.exports = app;
