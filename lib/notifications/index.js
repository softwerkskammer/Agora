"use strict";

var _ = require('lodash');
var async = require('async');
var conf = require('nconf');
var beans = conf.get('beans');
var groupsAndMembers = beans.get('groupsAndMembersAPI');
var membersAPI = beans.get('membersAPI');
var transport = beans.get('mailtransport');
var logger = require('winston').loggers.get('transactions');

function sendMail(emailAddresses, subject, text) {
  var fromName = 'notifier@softwerkskammer.org';
  var mailoptions = {
    from: '"' + fromName + '" <' + conf.get('sender-address') + '>',
    bcc: _.uniq(emailAddresses).toString(),
    subject: subject,
    text: text
  };

  var stringifiedOptions = JSON.stringify(mailoptions);
  transport.sendMail(mailoptions, function (err) {
    if (err) { return logger.error(err); }
    logger.info("Notification sent. Content: " + stringifiedOptions);
  });
}

function activityParticipation(activity, visitorID, ressourceName, content, type) {
  async.parallel({
      group: function (callback) { groupsAndMembers.getGroupAndMembersForList(activity.assignedGroup(), callback); },
      owner: function (callback) { membersAPI.getMemberForId(activity.owner(), callback); },
      visitor: function (callback) { membersAPI.getMemberForId(visitorID, callback); }
    },

    function (err, results) {
      if (err) { return logger.error(err); }
      var organizers = _.filter(results.group.members, function (member) { return _.contains(results.group.organizers, member.id()); });
      var organizersEmails = _.map(organizers, function (member) { return member.email(); });
      if (results.owner) {
        organizersEmails.push(results.owner.email());
      }
      if (_.isEmpty(organizersEmails)) { return; }
      var text = 'The activity "' + activity.title() + '" (' + ressourceName + ') ' + content + ':\n\n';
      text += results.visitor.firstname() + " " + results.visitor.lastname() + '\n\n';
      text += conf.get('publicUrlPrefix') + '/members/' + results.visitor.nickname();
      sendMail(organizersEmails, type, text);
    });
}

module.exports.visitorRegistration = function (activity, visitorID, ressourceName) {
  activityParticipation(activity, visitorID, ressourceName, 'has a new visitor', 'Visitor Registration');
};

module.exports.visitorUnregistration = function (activity, visitorID, ressourceName) {
  activityParticipation(activity, visitorID, ressourceName, 'has lost a visitor', 'Visitor Unregistration');
};

module.exports.waitinglistAddition = function (activity, visitorID, ressourceName) {
  activityParticipation(activity, visitorID, ressourceName, 'has a new member on the waitling list', 'Waitinglist Addition');
};

module.exports.waitinglistRemoval = function (activity, visitorID, ressourceName) {
  activityParticipation(activity, visitorID, ressourceName, 'has one member less on the waitling list', 'Waitinglist Removal');
};

