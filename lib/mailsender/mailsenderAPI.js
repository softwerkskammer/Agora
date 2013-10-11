"use strict";

var _ = require('underscore');
var async = require('async');

var conf = require('nconf');

var beans = conf.get('beans');
var statusmessage = beans.get('statusmessage');
var groupsAPI = beans.get('groupsAPI');
var groupsAndMembersAPI = beans.get('groupsAndMembersAPI');
var activitiesAPI = beans.get('activitiesCoreAPI');
var membersAPI = beans.get('membersAPI');
var Message = beans.get('message');
var Group = beans.get('group');

var transport = require('nodemailer').createTransport(conf.get('transport'), conf.get('transport-options'));

function invitationLinkFor(activity) {
  var url = conf.get('publicUrlPrefix') + '/activities/subscribe/' + activity.url;
  var text = 'Ich bin dabei!';
  var button = '<table style="border-collapse: collapse;"><tr><td style="border-style: solid; border-color: #E0E4EF #C8D2F0 #C8D2F0 #E0E4EF; border-width: 1px; padding: 5px 10px; background-color: #ECF0FA;"><a target="_blank" style="display: block; text-decoration: none; color: #0000CC!important; font-weight: bold; font-size: 1.1em;" href="' +
    url + '"><font color="#0000CC">' + text + '</font></a></td></tr></table>';

  return '\n\n' + '<table cellspacing="0" cellpadding="0" style="margin: 20px 0;"><tr style="font-weight: bold;">' +
    '<td style="padding-right: 5px;">' + button + '</td>' +
    '</tr></table>';
};

function sendMail(message, type, callback) {
  transport.sendMail(message.toTransportObject(conf.get('sender-address')), function (err) {
    var statemessage = err ?
      statusmessage.errorMessage('Email nicht gesendet', 'Deine ' + type + ' wurde nicht gesendet. Grund: ' + err) :
      statusmessage.successMessage('Email gesendet', 'Deine ' + type + ' ist unterwegs');
    callback(statemessage);
  });
}

module.exports = {
  dataForShowingMessageForActivity: function (activityURL, globalCallback) {
    async.parallel({
        activity: function (callback) { activitiesAPI.getActivity(activityURL, callback); },
        groups: function (callback) { groupsAPI.getAllAvailableGroups(callback); }
      },
      function (err, results) {
        if (err || !results.activity) { return globalCallback(err); }
        var activity = results.activity;
        var invitationGroup = _.find(results.groups, function (group) { return group.id === activity.assignedGroup; });
        var regionalGroups = groupsAPI.combineSubscribedAndAvailableGroups([invitationGroup], Group.regionalsFrom(results.groups));
        var thematicGroups = groupsAPI.combineSubscribedAndAvailableGroups([invitationGroup], Group.thematicsFrom(results.groups));

        var message = new Message();
        message.setSubject('Einladung: ' + activity.title);
        message.setMarkdown(activity.markdown());
        message.setHtmlAddOn(invitationLinkFor(activity));
        var result = {message: message, regionalgroups: regionalGroups, themegroups: thematicGroups, successURL: '/activities/' + activityURL };
        globalCallback(null, result);
      });
  },

  dataForShowingMessageToMember: function (nickname, callback) {
    membersAPI.getMember(nickname, function (err, member) {
      if (err || !member) {return callback(err); }
      var message = new Message();
      message.setReceiver(member);
      callback(null, {message: message, successURL: '/members/' + nickname });
    });
  },

  sendMailToParticipantsOf: function (activityURL, message, callback) {
    return activitiesAPI.getActivity(activityURL, function (err, activity) {
      membersAPI.getMembersForIds(activity.registeredMembers, function (err, members) {
        message.setBccToMemberAddresses(members);
        message.setHtmlAddOn(null);
        sendMail(message, 'Erinnerung', callback);
      });
    });
  },

  sendMailToInvitedGroups: function (invitedGroups, message, callback) {
    return groupsAPI.getGroups(invitedGroups, function (err, groups) {
      if (err) { return callback(err); }
      async.map(groups, groupsAndMembersAPI.addMembersToGroup, function (err, groups) {
        if (err) { return callback(err); }
        message.setBccToGroupMemberAddresses(groups);
        sendMail(message, 'Einladung', callback);
      });
    });
  },

  sendMailToMember: function (nickname, message, callback) {
    return membersAPI.getMember(nickname, function (err, member) {
      if (err) {return callback(err); }
      message.setReceiver(member);
      sendMail(message, 'Nachricht', callback);
    });
  }

};
