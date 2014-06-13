'use strict';

var conf = require('nconf');
var _ = require('lodash');
var beans = conf.get('beans');
var misc = beans.get('misc');
var dashboardService = beans.get('dashboardService');

var util = require('util');

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

var transformItem = function (language, item) {
  return {
    dialogUrl: item.dialogUrl(),
    pureName: item.pureName(),
    date: item.date().lang(language).format('L'),
    url: item.url(),
    dialogId: item.dialogId()
  };
};

var transformItems = function (items, language) {
  return _.map(items, _.partial(transformItem, language));
};

var transformStuffPerGroup = function (groupIds, stuffPerGroup, language) {
  var result = {};
  _.each(groupIds, function (groupId) {
    result[groupId] = transformItems(stuffPerGroup[groupId], language);
  });
  return result;
};

var transformMails;

var transformMail = function (language, mail) {
  console.log(util.inspect(mail));

  var result = {
    timeUnix: mail.timeUnix,
    id: mail.id,
    subject: mail.subject,
    memberNickname: mail.memberNickname(),
    displayedSenderName: mail.displayedSenderName()
  };

  if (mail.time) {
    result.time = mail.time.lang(language).format('L');
  }

  result.sortedResponses = transformMails(mail.sortedResponses(), language);
  return result;
};

transformMails = function (mails, language) {
  return _.map(mails, _.partial(transformMail, language));
};

var transformMailsByGroup = function (groupIds, mailsByGroup, language) {
  var result = {};
  _.each(groupIds, function (groupId) {
    result[groupId] = transformMails(mailsByGroup[groupId], language);
  });
  return result;
};

var transformResult = function (result, language) {
  result.activities = transformActivities(result.activities, language);

  result.memberId = transformMember(result.member);
  delete result.member;

  result.groupsPerColumn = transformGroupsPerColumn(result.groupsPerColumn);

  var groupIds = _.flatten(_.map(result.groupsPerColumn, function (groups) {
    return _.map(groups, 'id');
  }));

  result.postsByGroup = transformStuffPerGroup(groupIds, result.postsByGroup, language);
  result.changesByGroup = transformStuffPerGroup(groupIds, result.changesByGroup, language);

  result.mailsByGroup = transformMailsByGroup(groupIds, result.mailsByGroup, language);
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
