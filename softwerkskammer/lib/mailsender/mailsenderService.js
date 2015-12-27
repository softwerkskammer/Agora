'use strict';

var _ = require('lodash');
var async = require('async');

var conf = require('simple-configure');

var beans = conf.get('beans');
var groupsService = beans.get('groupsService');
var groupsAndMembersService = beans.get('groupsAndMembersService');
var activitiesService = beans.get('activitiesService');
var membersService = beans.get('membersService');
var memberstore = beans.get('memberstore');
var Message = beans.get('message');
var Group = beans.get('group');
var misc = beans.get('misc');
var statusmessage = beans.get('statusmessage');
var logger = require('winston').loggers.get('application');

var transport = beans.get('mailtransport');

function buttonFor(activity, resourceName) {
  var url = misc.toFullQualifiedUrl('activities/subscribe', activity.url() + '/' + resourceName);
  var text = ((activity.resourceNames().length === 1) ? '' : resourceName + ': ') + 'Count me in! - Ich bin dabei!';
  return {text: text, url: url};
}

function statusmessageForError(type, err) {
  return statusmessage.errorMessage('message.title.email_problem', 'message.content.mailsender.error_reason', {
    type: type,
    err: err.toString()
  });
}

function statusmessageForSuccess(type) {
  return statusmessage.successMessage('message.title.email_successful', 'message.content.mailsender.success', {type: type});
}

function sendMail(message, type, callback) {
  transport.sendMail(message.toTransportObject(conf.get('sender-address')), function (err) {
    if (err) { logger.error(err.stack); }
    callback(null, err ? statusmessageForError(type, err) : statusmessageForSuccess(type));
  });
}

function activityMarkdown(activity, language) {
  var markdown = activity.description() + '\n\n**Datum:** ' + activity.startMoment().locale(language || 'de').format('LLL') + '\n\n**Ort:** ' + activity.location();
  if (activity.hasDirection()) {
    markdown = markdown + '\n\n**Wegbeschreibung:**\n\n' + activity.direction();
  }
  return markdown;
}

module.exports = {
  activityMarkdown: activityMarkdown,

  dataForShowingMessageForActivity: function (activityURL, language, globalCallback) {
    async.parallel(
      {
        activity: function (callback) { activitiesService.getActivityWithGroupAndParticipants(activityURL, callback); },
        groups: function (callback) { groupsService.getAllAvailableGroups(callback); }
      },
      function (err, results) {
        if (err || !results.activity) { return globalCallback(err); }
        var activity = results.activity;
        var invitationGroup = _.find(results.groups, function (group) { return group.id === activity.assignedGroup(); });
        var regionalGroups = groupsService.combineSubscribedAndAvailableGroups([invitationGroup], Group.regionalsFrom(results.groups));
        var thematicGroups = groupsService.combineSubscribedAndAvailableGroups([invitationGroup], Group.thematicsFrom(results.groups));

        var message = new Message();
        message.setSubject('Einladung: ' + activity.title());
        message.setMarkdown(activityMarkdown(activity, language));
        message.addToButtons({
          text: 'Zur Aktivität',
          url: misc.toFullQualifiedUrl('activities', encodeURIComponent(activity.url()))
        });
        var result = {
          message: message,
          regionalgroups: regionalGroups,
          themegroups: thematicGroups,
          successURL: '/activities/' + encodeURIComponent(activityURL),
          activity: activity
        };
        globalCallback(null, result);
      }
    );
  },

  dataForShowingMessageToMember: function (nickname, callback) {
    memberstore.getMember(nickname, function (err, member) {
      if (err) {return callback(err); }
      if (!member) {return callback(new Error('Empfänger wurde nicht gefunden.')); }
      var message = new Message();
      message.setReceiver(member);
      callback(null, {message: message, successURL: '/members/' + encodeURIComponent(nickname)});
    });
  },

  sendMailToParticipantsOf: function (activityURL, message, callback) {
    var type = '$t(mailsender.reminder)';
    return activitiesService.getActivityWithGroupAndParticipants(activityURL, function (err, activity) {
      if (err) { return callback(err, statusmessageForError(type, err)); }
      message.setBccToMemberAddresses(activity.participants);
      sendMail(message, type, callback);
    });
  },

  sendMailToInvitedGroups: function (invitedGroups, message, callback) {
    var type = '$t(mailsender.invitation)';
    return groupsService.getGroups(invitedGroups, function (err, groups) {
      if (err) { return callback(err, statusmessageForError(type, err)); }
      if (groups.length === 0) { return callback(null, statusmessageForError(type, new Error('Keine der Gruppen wurde gefunden.'))); }
      async.map(groups, groupsAndMembersService.addMembersToGroup, function (err1, groups1) {
        if (err1) { return callback(err1, statusmessageForError(type, err1)); }
        message.setBccToGroupMemberAddresses(groups1);
        sendMail(message, type, callback);
      });
    });
  },

  sendMailToMember: function (nickname, message, callback) {
    var type = '$t(mailsender.notification)';
    return memberstore.getMember(nickname, function (err, member) {
      if (err) {return callback(err, statusmessageForError(type, err)); }
      if (!member) {return callback(null, statusmessageForError(type, new Error('Empfänger wurde nicht gefunden.'))); }
      message.setReceiver(member);
      sendMail(message, type, callback);
    });
  },

  sendRegistrationAllowed: function (member, activity, waitinglistEntry, callback) {
    var activityFullUrl = conf.get('publicUrlPrefix') + '/activities/' + encodeURIComponent(activity.url());
    var markdownGerman = 'Für die Veranstaltung ["' + activity.title() + '"](' + activityFullUrl + ') sind wieder Plätze frei.\n\nDu kannst Dich bis ' +
      waitinglistEntry.registrationValidUntil() + ' Uhr registrieren.';
    var markdownEnglish = 'There are a few more places for activity ["' + activity.title() + '"](' + activityFullUrl + ').\n\nYou can register until ' +
      waitinglistEntry.registrationValidUntil() + '.';
    var message = new Message();
    message.setReceiver(member);
    message.setSubject('Moving up for / Nachrücken für "' + activity.title() + '"');
    message.setMarkdown(markdownEnglish + '\n\n---\n\n' + markdownGerman);
    message.addToButtons(buttonFor(activity, waitinglistEntry.resourceName())); // TODO change to message.addToButtons(invitationLinkFor(activity));
    sendMail(message, 'Nachricht', callback);
  },

  sendResignment: function (markdown, member, callback) {
    var memberUrl = conf.get('publicUrlPrefix') + '/members/' + encodeURIComponent(member.nickname());
    var messageData = {
      markdown: member.displayName() + ' ([' + member.nickname() + '](' + memberUrl + ')) möchte gerne austreten.\n\n' + markdown,
      subject: 'Austrittswunsch',
      sendCopyToSelf: true
    };
    var message = new Message(messageData, member);
    membersService.superuserEmails(function (err, superusers) {
      if (err) { return callback(err); }
      message.setTo(superusers);
      sendMail(message, 'E-Mail zum Austrittswunsch', callback);
    });
  }

};
