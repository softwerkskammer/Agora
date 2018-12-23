const beans = require('simple-configure').get('beans');
const misc = beans.get('misc');
const dashboardService = beans.get('dashboardService');

const app = misc.expressAppIn(__dirname);

app.get('/', (req, res, next) => {
  dashboardService.dataForDashboard(req.user.member.nickname(), (err, result) => {
    if (err) { return next(err); }
    res.render('index', result);
  });
});

module.exports = app;
