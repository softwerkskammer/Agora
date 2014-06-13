'use strict';

var conf = require('nconf');
var _ = require('lodash');
var beans = conf.get('beans');
var misc = beans.get('misc');
var dashboardService = beans.get('dashboardService');

var app = misc.expressAppIn(__dirname);

app.get('/', function (req, res, next) {
  dashboardService.dataForDashboard(req.user.member.nickname(), function (err, result) {
    if (err) { return next(err); }
    res.render('index', result);
  });
});

var transformActivity = function (activity) {
  return { allRegisteredMembers: activity.allRegisteredMembers() };
};

var transformActivities = function (activities) {
  return _.map(activities, transformActivity);
};

app.get('/json', function (req, res, next) {
  dashboardService.dataForDashboard(req.user.member.nickname(), function (err, result) {
    if (err) { return next(err); }

    var json = {};
    json.activities = transformActivities(result.activities);

    res.render('indexJson', json);
    // res.end(JSON.stringify(result));
  });
});

module.exports = app;
