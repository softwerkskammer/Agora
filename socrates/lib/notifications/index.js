'use strict';

var _ = require('lodash');
var conf = require('simple-configure');
var logger = require('winston').loggers.get('transactions');
var jade = require('jade');
var path = require('path');

var beans = conf.get('beans');
var notifications = beans.get('notifications');
var memberstore = beans.get('memberstore');
var membersService = beans.get('membersService');
var subscriberstore = beans.get('subscriberstore');
var Member = beans.get('member');
var transport = beans.get('mailtransport');
var socratesConstants = beans.get('socratesConstants');

function renderingOptions(member) {
  return {
    pretty: true,
    member: member,
    url: conf.get('publicUrlPrefix')
  };
}

function notifyMemberAndSuperuser(member, bookingdetails, participantFilename, participantSubject, superuserFilename, superuserSubject) {
  var options = renderingOptions(member);
  options.bookingdetails = bookingdetails;
  var filename = path.join(__dirname, 'jade/' + participantFilename + '.jade');
  var receivers = [member.email()];
  notifications._sendMail(receivers, participantSubject, jade.renderFile(filename, options));
  membersService.superuserEmails(function (err, superusers) {
    if (err || !superusers) { return logger.error(err); }
    var filenameSuperuser = path.join(__dirname, 'jade/' + superuserFilename + '.jade');
    notifications._sendMail(superusers, superuserSubject, jade.renderFile(filenameSuperuser, options));
  });
}
module.exports = {
  newSoCraTesMemberRegistered: function (member) {
    membersService.superuserEmails(function (err, receivers) {
      if (err || !receivers) { return logger.error(err); }
      subscriberstore.allSubscribers(function (err, subscribers) {
        if (err || !subscribers) { return logger.error(err); }
        var options = renderingOptions(member);
        options.count = subscribers.length;
        var filename = path.join(__dirname, 'jade/newmembertemplate.jade');
        notifications._sendMail(receivers, 'Neuer Interessent', jade.renderFile(filename, options));
      });
    });
  },

  newParticipant: function (memberID, bookingdetails) {
    memberstore.getMemberForId(memberID, function (err, member) {
      if (err || !member) { return logger.error(err); }
      notifyMemberAndSuperuser(member, bookingdetails, 'registrationConfirmation', 'SoCraTes Registration Confirmation',
        'superuserRegistrationNotification', 'New SoCraTes Registration');
    });
  },

  changedDuration: function (member, bookingdetails) {
    notifyMemberAndSuperuser(member, bookingdetails, 'changedDuration', 'SoCraTes Change of Length of Stay',
      'superuserDurationChangeNotification', 'Change in SoCraTes Registration');
  },

  newWaitinglistEntry: function (memberID, bookingdetails) {
    memberstore.getMemberForId(memberID, function (err, member) {
      if (err || !member) { return logger.error(err); }
      notifyMemberAndSuperuser(member, bookingdetails, 'waitinglistConfirmation', 'SoCraTes Waitinglist Confirmation',
        'superuserWaitinglistNotification', 'New SoCraTes Waitinglist Entry');
    });
  },

  paymentMarked: function (nickname) {
    memberstore.getMember(nickname, function (err, member) {
      if (err || !member) {
        logger.error("Error sending payment notification mail to member " + nickname);
        logger.error(err);
        return;
      }
      var options = renderingOptions(member);
      options.activityTitle = "SoCraTes " + socratesConstants.currentYear;
      var filename = path.join(__dirname, 'jade/paymenttemplate.jade');
      var receivers = [member.email()];
      notifications._sendMail(receivers, 'Payment Receipt / Zahlungseingang', jade.renderFile(filename, options));
    });
  }

};
