'use strict';

var conf = require('nconf');
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

module.exports = app;
