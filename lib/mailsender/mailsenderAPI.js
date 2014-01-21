"use strict";

var _ = require('lodash');
var async = require('async');

var conf = require('nconf');

var beans = conf.get('beans');
var groupsAPI = beans.get('groupsAPI');
var groupsAndMembersAPI = beans.get('groupsAndMembersAPI');
var activitiesAPI = beans.get('activitiesAPI');
var membersAPI = beans.get('membersAPI');
var Message = beans.get('message');
var Group = beans.get('group');

var transport = beans.get('mailtransport');

function buttonFor(activity, resourceName) {
  var url = conf.get('publicUrlPrefix') + '/activities/subscribe/' + activity.url() + '/' + resourceName;
  var text = ((activity.resourceNames().length === 1) ? '' : resourceName + ': ') + 'Ich bin dabei!';
  var button = '<a class="btn" style="max-width: 400px;", href="' + url + '">' + text + '</a>';
  return button;
}
function invitationLinkFor(activity) {
  var buttons = "";
  _.each(activity.resourceNames(), function (resourceName) {
    buttons = buttons + buttonFor(activity, resourceName);
  });
  return buttons;
}

function sendMail(message, type, callback) {
  transport.sendMail(message.toTransportObject(conf.get('sender-address')), function (err) {
    callback(err, type);
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
        message.setHtmlAddOn(invitationLinkFor(activity));
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
      message.setBccToMemberAddresses(activity.visitors);
      message.setHtmlAddOn(null);
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
    var activityFullUrl = conf.get('publicUrlPrefix') + '/activities/' + activity.url();
    var markdown = 'Für die Veranstaltung ["' + activity.title() + '"](' + activityFullUrl + ') sind wieder Plätze frei.\n\nDu kannst Dich bis ' +
      waitinglistEntry.registrationValidUntil() + ' Uhr registrieren.';
    var message = new Message();
    message.setReceiver(member);
    message.setSubject('Nachrücken für "' + activity.title() + '"');
    message.setMarkdown(markdown);
    message.setHtmlAddOn(buttonFor(activity, waitinglistEntry.resourceName()));
    sendMail(message, 'Nachricht', callback);
  }

};
