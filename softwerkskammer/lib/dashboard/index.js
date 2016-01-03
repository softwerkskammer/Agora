'use strict';

var _ = require('lodash');
var moment = require('moment-timezone');
var beans = require('simple-configure').get('beans');
var misc = beans.get('misc');
var dashboardService = beans.get('dashboardService');
var groupsAndMembersService = beans.get('groupsAndMembersService');
var wikiService = beans.get('wikiService');
var mailarchiveService = beans.get('mailarchiveService');
var activitiesService = beans.get('activitiesService');


// var util = require('util');

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
  // console.log(util.inspect(mail));

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


app.get('/json/groupData/:groupId', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');

  var basicHeight = 3;
  var basicHeightPerSection = 1;
  var oneMonthAgo = moment().subtract(1, 'months');

  var result = {};
  var lines = basicHeight; // for header etc.
  wikiService.getBlogpostsForGroup(req.params.groupId, function (err, blogposts) {
    if (err) { return next(err); }
    result.blogs = blogposts;
    lines = lines + basicHeightPerSection + blogposts.length;
    wikiService.listChangedFilesinDirectory(req.params.groupId, function (err1, metadatas) {
      if (err1) { return next(err1); }
      result.wiki = metadatas;
      lines = lines + basicHeightPerSection + metadatas.length;
      mailarchiveService.unthreadedMailsYoungerThan(req.params.groupId, oneMonthAgo.unix(), function (err2, mails) {
        if (err2) { return next(err2); }
        result.email = mails;
        result.lines = lines + basicHeightPerSection + mails.length;
        res.end(JSON.stringify(result));
      });
    });
  });

});


app.get('/json/subscribedGroups/', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');

  if (!res.locals.accessrights.isRegistered()) {
    return res.end(JSON.stringify({}));
  }

  groupsAndMembersService.getMemberWithHisGroups(req.user.member.nickname(), function (err, member) {
    if (err) { return next(err); }
    if (!member) { return next(new Error('no member found')); }

    var result = _.map(member.subscribedGroups, function (group) {
      return { name: group.longName, id: group.id, type: group.type, color: group.color };
    });

    res.end(JSON.stringify({ all: result }));
  });
});


app.get('/json/events/', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');

  if (!res.locals.accessrights.isRegistered()) {
    return res.end(JSON.stringify({}));
  }

  groupsAndMembersService.getMemberWithHisGroups(req.user.member.nickname(), function (err, member) {
    if (err) { return next(err); }
    if (!member) { return next(new Error('no member found')); }
    activitiesService.getUpcomingActivitiesOfMemberAndHisGroups(member, function (err1, activities) {
      if (err1) { return next(err1); }

      var result = _.map(activities, function (activity) {
        return { eventName: activity.state.title, date: activity.state.startUnix };
      });

      res.end(JSON.stringify({ all: result }));
    });
  });
});

module.exports = app;
