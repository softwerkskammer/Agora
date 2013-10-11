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
  var styledefinition = '<style type="text/css">' +
    'a.btn {' +
    'background-color: rgb(66, 139, 202);' +
    'border-bottom-color: rgb(53, 126, 189);' +
    'border-bottom-left-radius: 4px;' +
    'border-bottom-right-radius: 4px;' +
    'border-bottom-style: solid;' +
    'border-bottom-width: 1px;' +
    'border-image-outset: 0px;' +
    'border-image-repeat: stretch;' +
    'border-image-slice: 100%;' +
    'border-image-source: none;' +
    'border-image-width: 1;' +
    'border-left-color: rgb(53, 126, 189);' +
    'border-left-style: solid;' +
    'border-left-width: 1px;' +
    'border-right-color: rgb(53, 126, 189);' +
    'border-right-style: solid;' +
    'border-right-width: 1px;' +
    'border-top-color: rgb(53, 126, 189);' +
    'border-top-left-radius: 4px;' +
    'border-top-right-radius: 4px;' +
    'border-top-style: solid;' +
    'border-top-width: 1px;' +
    'box-sizing: border-box;' +
    'color: rgb(255, 255, 255);' +
    'cursor: pointer;' +
    'display: inline-block;' +
    'font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;' +
    'font-size: 14px;' +
    'font-weight: normal;' +
    'height: 34px;' +
    'line-height: 20px;' +
    'margin-bottom: 0px;' +
    'padding-bottom: 6px;' +
    'padding-left: 12px;' +
    'padding-right: 12px;' +
    'padding-top: 6px;' +
    'text-align: center;' +
    'text-decoration: none;' +
    'vertical-align: middle;' +
    'white-space: nowrap;' +
    'width: 166px;     }' +
    '</style>';
  var url = conf.get('publicUrlPrefix') + '/activities/subscribe/' + activity.url;
  var text = 'Ich bin dabei!';
  var button = '<a class="btn" href="' +    url + '">' + text + '</a>';

  return styledefinition + '\n\n' + button;
}

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
