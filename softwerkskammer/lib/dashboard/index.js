'use strict';

const beans = require('simple-configure').get('beans');
const misc = beans.get('misc');
const dashboardService = beans.get('dashboardService');

const transformResult = require('./transformToPlainJson');

const app = misc.expressAppIn(__dirname);

app.get('/', (req, res, next) => {
  dashboardService.dataForDashboard(req.user.member.nickname(), (err, result) => {
    if (err) { return next(err); }
    res.render('index', result);
  });
});

app.get('/json', (req, res, next) => {
  dashboardService.dataForDashboard(req.user.member.nickname(), (err, result) => {
    if (err) { return next(err); }
    res.render('indexJson', transformResult(result, res.locals.language));
  });
});

module.exports = app;
