"use strict";

var _ = require('lodash');
var async = require('async');
var conf = require('nconf');
var beans = conf.get('beans');
var groupsAndMembers = beans.get('groupsAndMembersAPI');
var membersAPI = beans.get('membersAPI');
var transport = beans.get('mailtransport');
var logger = require('winston').loggers.get('transactions');
var jade = require('jade');
var path = require('path');

function sendMail(emailAddresses, subject, html, callback) {
  var fromName = 'Softwerkskammer Benachrichtigungen';
  var mailoptions = {
    from: '"' + fromName + '" <' + conf.get('sender-address') + '>',
    bcc: _.uniq(emailAddresses).toString(),
    subject: subject,
    html: html,
    generateTextFromHTML: true
  };

  var stringifiedOptions = JSON.stringify(mailoptions);
  transport.sendMail(mailoptions, function (err) {
    if (callback) {
      if (err) { return callback(err); }
      return callback(null, stringifiedOptions);
    }
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
      var renderingOptions = {
        pretty: true,
        activity: activity,
        ressourceName: ressourceName,
        content: content,
        count: activity.resourceNamed(ressourceName).registeredMembers().length,
        visitor: results.visitor,
        url: conf.get('publicUrlPrefix')
      };
      var filename = path.join(__dirname, 'jade/activitytemplate.jade');
      sendMail(organizersEmails, type, jade.renderFile(filename, renderingOptions));
    });
}

function wikiNotificationMembers(members) {
  return _(members).filter(function (member) { return member.notifyOnWikiChanges(); }).map(function (member) {return member.email(); }).value();
}

function superuserEmails(members) {
  return _(members).filter(function (member) { return member.isSuperuser(); }).map(function (member) {return member.email(); }).value();
}

module.exports.visitorRegistration = function (activity, visitorID, ressourceName) {
  activityParticipation(activity, visitorID, ressourceName, 'hat sich ein neuer Besucher angemeldet', 'Neue Anmeldung für Aktivität');
};

module.exports.visitorUnregistration = function (activity, visitorID, ressourceName) {
  activityParticipation(activity, visitorID, ressourceName, 'hat sich ein Besucher abgemeldet', 'Abmeldung für Aktivität');
};

module.exports.waitinglistAddition = function (activity, visitorID, ressourceName) {
  activityParticipation(activity, visitorID, ressourceName, 'hat sich jemand auf die Warteliste eingetragen', 'Zugang auf Warteliste');
};

module.exports.waitinglistRemoval = function (activity, visitorID, ressourceName) {
  activityParticipation(activity, visitorID, ressourceName, 'hat sich jemand von der Warteliste entfernt', 'Streichung aus Warteliste');
};

module.exports.wikiChanges = function (changes, callback) {
  membersAPI.allMembers(function (err, members) {
    if (err) { return callback(err); }
    var renderingOptions = {
      pretty: true,
      directories: _.sortBy(changes, 'dir'),
      url: conf.get('publicUrlPrefix')
    };
    var filename = path.join(__dirname, 'jade/wikichangetemplate.jade');
    var receivers = _.union(superuserEmails(members), wikiNotificationMembers(members));
    sendMail(receivers, 'Wiki Änderungen', jade.renderFile(filename, renderingOptions), callback);
  });
};
