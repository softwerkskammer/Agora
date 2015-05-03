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
      var options = renderingOptions(member);
      options.bookingdetails = bookingdetails;
      var filename = path.join(__dirname, 'jade/registrationConfirmation.jade');
      var receivers = [member.email()];
      notifications._sendMail(receivers, 'SoCraTes Registration Confirmation', jade.renderFile(filename, options));
      membersService.superuserEmails(function (err, superusers) {
        if (err || !superusers) { return logger.error(err); }
        var filenameSuperuser = path.join(__dirname, 'jade/superuserRegistrationNotification.jade');
        notifications._sendMail(superusers, 'New SoCraTes Registration', jade.renderFile(filenameSuperuser, options));
      });
    });
  },

  changedDuration: function (member, bookingdetails) {
    var options = renderingOptions(member);
    options.bookingdetails = bookingdetails;
    var filename = path.join(__dirname, 'jade/changedDuration.jade');
    var receivers = [member.email()];
    notifications._sendMail(receivers, 'SoCraTes Change of Length of Stay', jade.renderFile(filename, options));
    membersService.superuserEmails(function (err, superusers) {
      if (err || !superusers) { return logger.error(err); }
      var filenameSuperuser = path.join(__dirname, 'jade/superuserDurationChangeNotification.jade');
      notifications._sendMail(superusers, 'Change in SoCraTes Registration', jade.renderFile(filenameSuperuser, options));
    });
  },

  newWaitinglistEntry: function (memberID, bookingdetails) {
    memberstore.getMemberForId(memberID, function (err, member) {
      if (err || !member) { return logger.error(err); }
      var options = renderingOptions(member);
      options.bookingdetails = bookingdetails;
      var filename = path.join(__dirname, 'jade/waitinglistConfirmation.jade');
      var receivers = [member.email()];
      notifications._sendMail(receivers, 'SoCraTes Waitinglist Confirmation', jade.renderFile(filename, options));
      membersService.superuserEmails(function (err, superusers) {
        if (err || !superusers) { return logger.error(err); }
        var filenameSuperuser = path.join(__dirname, 'jade/superuserWaitinglistNotification.jade');
        notifications._sendMail(superusers, 'New SoCraTes Waitinglist Entry', jade.renderFile(filenameSuperuser, options));
      });
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
