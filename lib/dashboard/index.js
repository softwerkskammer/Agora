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

var transformActivity = function (language, activity) {
  return { allRegisteredMembers: activity.allRegisteredMembers(),
    startMoment: activity.startMoment().lang(language).format('L'),
    url: activity.url(),
    title: activity.title(),
    groupName: activity.groupName(),
    colorRGB: activity.colorRGB };
};

var transformMember = function (member) {
  return member ? member.id() : undefined;
};

var transformActivities = function (activities, language) {
  return _.map(activities, _.partial(transformActivity, language));
};

var transformGroup = function (group) {
  return { id: group.id,
    longName: group.longName,
    color: group.color };
};

var transformGroups = function (groups) {
  return _.map(groups, transformGroup);
};

var transformGroupsPerColumn = function (groupsPerColumn) {
  return _.map(groupsPerColumn, transformGroups);
};

var transformItem = function (item, language) {
  return {
    dialogUrl: item.dialogUrl(),
    pureName: item.pureName(),
    date: item.date().lang(language).format('L'),
    url: item.url(),
    dialogId: item.dialogId()
  };
};

var transformStuffPerGroup = function (stuffPerGroup, language) {
  var result = {};
  var key;
  for (key in stuffPerGroup) {
    if (stuffPerGroup.hasOwnProperty(key)) {
      result[key] = transformItem(stuffPerGroup[key], language);
    }
  }
  return result;
};

var transformResult = function (result, language) {
  result.activities = transformActivities(result.activities, language);

  result.memberId = transformMember(result.member);
  delete result.member;

  result.groupsPerColumn = transformGroupsPerColumn(result.groupsPerColumn);

  result.postsByGroup = transformStuffPerGroup(result.postsByGroup, language);
  result.changesByGroup = transformStuffPerGroup(result.changesByGroup, language);
};

app.get('/json', function (req, res, next) {
  dashboardService.dataForDashboard(req.user.member.nickname(), function (err, result) {
    if (err) { return next(err); }

    transformResult(result, res.locals.language);

    res.render('indexJson', result);
  });
});

app.get('/jsonRaw', function (req, res, next) {
  dashboardService.dataForDashboard(req.user.member.nickname(), function (err, result) {
    if (err) { return next(err); }

    transformResult(result, res.locals.language);

    res.end(JSON.stringify(result));
  });
});

module.exports = app;
