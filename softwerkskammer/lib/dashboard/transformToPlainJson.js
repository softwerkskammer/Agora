'use strict';

const R = require('ramda');

function transformActivities(activities, language) {
  function transformActivity(activity) {
    return {
      allRegisteredMembers: activity.allRegisteredMembers(),
      startMoment: activity.startMoment().locale(language).format('L'),
      url: activity.url(),
      title: activity.title(),
      groupName: activity.groupName(),
      colorRGB: activity.colorRGB
    };
  }

  return activities.map(transformActivity);
}

function transformGroupsPerColumn(groupsPerColumn) {
  function transformGroups(groups) {
    return groups.map(group => { return {id: group.id, longName: group.longName, color: group.color}; });
  }

  return groupsPerColumn.map(transformGroups);
}

function transformStuffPerGroup(groupIds, stuffPerGroup, language) {
  function transformItems(items) {
    function transformItem(item) {
      return {
        dialogUrl: item.dialogUrl(),
        pureName: item.pureName(),
        date: item.date().locale(language).format('L'),
        url: item.url(),
        dialogId: item.dialogId()
      };
    }

    return items.map(transformItem);
  }

  const result = {};
  groupIds.forEach(groupId => { result[groupId] = transformItems(stuffPerGroup[groupId]); });
  return result;
}

function transformMails(mails, language) {
  function transformMail(mail) {
    const result = {
      timeUnix: mail.timeUnix,
      id: mail.id,
      subject: mail.subject,
      memberNickname: mail.memberNickname(),
      displayedSenderName: mail.displayedSenderName(),
      sortedResponses: transformMails(mail.sortedResponses(), language)
    };
    if (mail.time) { result.time = mail.time.lang(language).format('L'); }

    return result;
  }

  return mails.map(transformMail);
}

function transformMailsByGroup(groupIds, mailsByGroup, language) {
  const result = {};
  groupIds.forEach(groupId => { result[groupId] = transformMails(mailsByGroup[groupId], language); });
  return result;
}

module.exports = function transformResult(result, language) {
  const groupIds = R.flatten(result.groupsPerColumn.map(groups => groups.map(group => group.id)));
  return {
    activities: transformActivities(result.activities, language),
    memberId: result.member ? result.member.id() : undefined,
    groupsPerColumn: transformGroupsPerColumn(result.groupsPerColumn),
    postsByGroup: transformStuffPerGroup(groupIds, result.postsByGroup, language),
    changesByGroup: transformStuffPerGroup(groupIds, result.changesByGroup, language),
    mailsByGroup: transformMailsByGroup(groupIds, result.mailsByGroup, language)
  };
};
