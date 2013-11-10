"use strict";

var _ = require('underscore');
var async = require('async');

var conf = require('nconf');

var beans = conf.get('beans');
var groupsAPI = beans.get('groupsAPI');
var groupsAndMembersAPI = beans.get('groupsAndMembersAPI');
var activitiesAPI = beans.get('activitiesCoreAPI');
var membersAPI = beans.get('membersAPI');
var Message = beans.get('message');
var Group = beans.get('group');

var transport = require('nodemailer').createTransport(conf.get('transport'), conf.get('transport-options'));

function invitationLinkFor(activity) {
  // TODO generate one button for each resource
  var url = conf.get('publicUrlPrefix') + '/activities/subscribe/' + activity.url() + '/default';
  var text = 'Ich bin dabei!';
  return '<a class="btn" href="' + url + '">' + text + '</a>';
}

function sendMail(message, type, callback) {
  transport.sendMail(message.toTransportObject(conf.get('sender-address')), function (err) {
    callback(err, type);
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
        var invitationGroup = _.find(results.groups, function (group) { return group.id === activity.assignedGroup(); });
        var regionalGroups = groupsAPI.combineSubscribedAndAvailableGroups([invitationGroup], Group.regionalsFrom(results.groups));
        var thematicGroups = groupsAPI.combineSubscribedAndAvailableGroups([invitationGroup], Group.thematicsFrom(results.groups));

        var message = new Message();
        message.setSubject('Einladung: ' + activity.title());
        message.setMarkdown(activity.markdown());
        message.setHtmlAddOn(invitationLinkFor(activity));
        var result = {message: message, regionalgroups: regionalGroups, themegroups: thematicGroups, successURL: '/activities/' + activityURL };
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
    return activitiesAPI.getActivity(activityURL, function (err, activity) {
      if (err) { return callback(err, type); }
      membersAPI.getMembersForIds(activity.allRegisteredMembers(), function (err, members) {
        if (err) { return callback(err, type); }
        message.setBccToMemberAddresses(members);
        message.setHtmlAddOn(null);
        sendMail(message, type, callback);
      });
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
  }

};
