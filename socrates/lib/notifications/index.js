'use strict';

var _ = require('lodash');
var conf = require('simple-configure');
var beans = conf.get('beans');
var memberstore = beans.get('memberstore');
var participantstore = beans.get('participantstore');
var Member = beans.get('member');
var transport = beans.get('mailtransport');
var logger = require('winston').loggers.get('transactions');
var jade = require('jade');
var path = require('path');

function sendMail(emailAddresses, subject, html, callback) {
  if (!emailAddresses || emailAddresses.length === 0) {
    if (callback) { return callback(null); }
    return;
  }

  var fromName = 'Softwerkskammer Benachrichtigungen';
  var mailoptions = {
    from: '"' + fromName + '" <' + conf.get('sender-address') + '>',
    bcc: _.uniq(emailAddresses).toString(),
    subject: subject,
    html: html,
    generateTextFromHTML: true
  };

  transport.sendMail(mailoptions, function (err) {
    if (callback) { return callback(err); }

    if (err) { return logger.error(err); }
    logger.info('Notification sent. Content: ' + JSON.stringify(mailoptions));
  });
}

module.exports.newSoCraTesMemberRegistered = function (member) {
  memberstore.allMembers(function (err, members) {
    if (err || !members) { return logger.error(err); }
    participantstore.allParticipants(function (err, participants) {
      if (err || !participants) { return logger.error(err); }
      var renderingOptions = {
        pretty: true,
        member: member,
        url: conf.get('publicUrlPrefix'),
        count: participants.length
      };
      var filename = path.join(__dirname, 'jade/newmembertemplate.jade');
      var receivers = Member.superuserEmails(members);
      sendMail(receivers, 'Neuer Interessent', jade.renderFile(filename, renderingOptions));
    });
  });
};
