"use strict";

var _ = require('lodash');
var async = require('async');
var conf = require('nconf');
var beans = conf.get('beans');
var groupsAndMembers = beans.get('groupsAndMembersAPI');
var membersAPI = beans.get('membersAPI');
var transport = beans.get('mailtransport');
var logger = require('winston').loggers.get('transactions');

function sendMail(emailAddresses, subject, text, callback) {
  var fromName = 'Softwerkskammer Benachrichtigungen';
  var mailoptions = {
    from: '"' + fromName + '" <' + conf.get('sender-address') + '>',
    bcc: _.uniq(emailAddresses).toString(),
    subject: subject,
    text: text
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
      var text = 'Für die Aktivität "' + activity.title() + '" (' + ressourceName + ') ' + content + ':\n\n';
      text += results.visitor.firstname() + " " + results.visitor.lastname() + ' (' + results.visitor.nickname() + ')\n';
      text += 'Damit hat die Aktivität jetzt ' + activity.resourceNamed(ressourceName).registeredMembers().length + ' Anmeldungen.' + '\n\n';
      text += conf.get('publicUrlPrefix') + '/activities/' + encodeURIComponent(activity.url()) + '\n';
      sendMail(organizersEmails, type, text);
    });
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
    var emailtext = 'Es gibt Änderungen im Wiki auf folgenden Seiten:\n\n';
    emailtext += _(changes).sortBy('dir').reduce(function (result, current) {return result + current.changetext(); }, '');
    var receivers = _(members).filter(function (member) {return member.isSuperuser(); }).map(function (member) {return member.email(); }).value();
    sendMail(receivers, 'Wiki Änderungen', emailtext, callback);
  });
};
