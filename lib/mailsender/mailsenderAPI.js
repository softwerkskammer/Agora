"use strict";

var _ = require('lodash');
var async = require('async');

var conf = require('nconf');

var beans = conf.get('beans');
var groupsAPI = beans.get('groupsAPI');
var groupsAndMembersAPI = beans.get('groupsAndMembersAPI');
var activitiesAPI = beans.get('activitiesAPI');
var membersAPI = beans.get('membersAPI');
var Member = beans.get('member');
var Message = beans.get('message');
var Group = beans.get('group');
var misc = beans.get('misc');
var statusmessage = beans.get('statusmessage');

var transport = beans.get('mailtransport');

function buttonFor(activity, resourceName) {
  var url = misc.toFullQualifiedUrl('activities/subscribe', activity.url() + '/' + resourceName);
  var text = ((activity.resourceNames().length === 1) ? '' : resourceName + ': ') + 'Ich bin dabei!';
  return {text: text, url: url};
}

function invitationLinkFor(activity) {
  var url = misc.toFullQualifiedUrl('activities', encodeURIComponent(activity.url()));
  var buttons = [];
  buttons.push({text: 'Zur Aktivität', url: url});
  _.each(activity.resourceNames(), function (resourceName) {
    buttons.push(buttonFor(activity, resourceName));
  });
  return buttons;
}

function sendMail(message, type, callback) {
  transport.sendMail(message.toTransportObject(conf.get('sender-address')), function (err) {
    var message = err ?
      statusmessage.errorMessage('message.title.email_problem', 'message.content.mailsender.error_reason', {type: type, err: err.toString()}) :
      statusmessage.successMessage('message.title.email_successful', 'message.content.mailsender.success', {type: type});

    callback(message);
  });
}

function activityMarkdown(activity, language) {
  var markdown = activity.description() + '\n\n**Datum:** ' + activity.startMoment().lang(language || 'de').format('LLL') + '\n\n**Ort:** ' + activity.location();
  if (activity.hasDirection()) {
    markdown = markdown + '\n\n**Wegbeschreibung:**\n\n' + activity.direction();
  }
  return markdown;
}

module.exports = {
  activityMarkdown: activityMarkdown,

  dataForShowingMessageForActivity: function (activityURL, language, globalCallback) {
    async.parallel({
        activity: function (callback) { activitiesAPI.getActivityWithGroupAndParticipants(activityURL, callback); },
        groups: function (callback) { groupsAPI.getAllAvailableGroups(callback); }
      },
      function (err, results) {
        if (err || !results.activity) { return globalCallback(err); }
        var activity = results.activity;
        var invitationGroup = _.find(results.groups, function (group) { return group.id === activity.assignedGroup(); });
        var regionalGroups = groupsAPI.combineSubscribedAndAvailableGroups([invitationGroup], Group.regionalsFrom(results.groups));
        var thematicGroups = groupsAPI.combineSubscribedAndAvailableGroups([invitationGroup], Group.thematicsFrom(results.groups));

        var message = new Message();
        message.setSubject('Einladung: ' + activity.title());
        message.setMarkdown(activityMarkdown(activity, language));
        message.addToButtons(invitationLinkFor(activity));
        var result = {message: message, regionalgroups: regionalGroups, themegroups: thematicGroups, successURL: '/activities/' + activityURL, activity: activity };
        globalCallback(null, result);
      });
  },

  dataForShowingMessageToMember: function (nickname, callback) {
    membersAPI.getMember(nickname, function (err, member) {
      if (err) {return callback(err); }
      if (!member) {return callback(new Error('Empfänger wurde nicht gefunden.')); }
      var message = new Message();
      message.setReceiver(member);
      callback(null, {message: message, successURL: '/members/' + nickname });
    });
  },

  sendMailToParticipantsOf: function (activityURL, message, callback) {
    var type = 'Erinnerung';
    return activitiesAPI.getActivityWithGroupAndParticipants(activityURL, function (err, activity) {
      if (err) { return callback(err, type); }
      message.setBccToMemberAddresses(activity.participants);
      var url = misc.toFullQualifiedUrl('activities', encodeURIComponent(activity.url()));
      message.addToButtons({text: 'Zur Aktivität', url: url});
      sendMail(message, type, callback);
    });
  },

  sendMailToInvitedGroups: function (invitedGroups, message, callback) {
    var type = 'Einladung';
    return groupsAPI.getGroups(invitedGroups, function (err, groups) {
      if (err) { return callback(err, type); }
      async.map(groups, groupsAndMembersAPI.addMembersToGroup, function (err, groups) {
        if (err) { return callback(err, type); }
        message.setBccToGroupMemberAddresses(groups);
        sendMail(message, type, callback);
      });
    });
  },

  sendMailToMember: function (nickname, message, callback) {
    var type = 'Nachricht';
    return membersAPI.getMember(nickname, function (err, member) {
      if (err) {return callback(err, type); }
      if (!member) {return callback(new Error('Empfänger wurde nicht gefunden.'), type); }
      message.setReceiver(member);
      sendMail(message, type, callback);
    });
  },

  sendRegistrationAllowed: function (member, activity, waitinglistEntry, callback) {
    var activityFullUrl = conf.get('publicUrlPrefix') + '/activities/' + encodeURIComponent(activity.url());
    var markdown = 'Für die Veranstaltung ["' + activity.title() + '"](' + activityFullUrl + ') sind wieder Plätze frei.\n\nDu kannst Dich bis ' +
      waitinglistEntry.registrationValidUntil() + ' Uhr registrieren.';
    var message = new Message();
    message.setReceiver(member);
    message.setSubject('Nachrücken für "' + activity.title() + '"');
    message.setMarkdown(markdown);
    message.addToButtons(buttonFor(activity, waitinglistEntry.resourceName()));
    sendMail(message, 'Nachricht', callback);
  },

  sendResignment: function (markdown, member, callback) {
    var memberUrl = conf.get('publicUrlPrefix') + '/members/' + encodeURIComponent(member.nickname());
    var messageData = {markdown: member.displayName() + ' ([' + member.nickname() + '](' + memberUrl + ')) möchte gerne austreten.\n\n' + markdown, subject: 'Austrittswunsch', sendCopyToSelf: true};
    var message = new Message(messageData, member);
    membersAPI.allMembers(function (err, members) {
      message.setTo(Member.superuserEmails(members));
      sendMail(message, 'E-Mail zum Austrittswunsch', callback);
    });
  }

};
