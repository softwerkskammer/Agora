'use strict';

var _ = require('lodash');
var conf = require('simple-configure');
var beans = conf.get('beans');
var notifications = beans.get('notifications');
var memberstore = beans.get('memberstore');
var subscriberstore = beans.get('subscriberstore');
var Member = beans.get('member');
var transport = beans.get('mailtransport');
var logger = require('winston').loggers.get('transactions');
var jade = require('jade');
var path = require('path');

function renderingOptions(member) {
  return {
    pretty: true,
    member: member,
    url: conf.get('publicUrlPrefix')
  };
}

module.exports = {
  newSoCraTesMemberRegistered: function (member) {
    memberstore.allMembers(function (err, members) {
      if (err || !members) { return logger.error(err); }
      subscriberstore.allSubscribers(function (err, subscribers) {
        if (err || !subscribers) { return logger.error(err); }
        var options = renderingOptions(member);
        options.count = subscribers.length;
        var filename = path.join(__dirname, 'jade/newmembertemplate.jade');
        var receivers = Member.superuserEmails(members);
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
      memberstore.allMembers(function (err, members) {
        if (err || !members) { return logger.error(err); }
        var filenameSuperuser = path.join(__dirname, 'jade/superuserRegistrationNotification.jade');
        var superusers = Member.superuserEmails(members);
        notifications._sendMail(superusers, 'New SoCraTes Registration', jade.renderFile(filenameSuperuser, options));
      });
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
      memberstore.allMembers(function (err, members) {
        if (err || !members) { return logger.error(err); }
        var filenameSuperuser = path.join(__dirname, 'jade/superuserWaitinglistNotification.jade');
        var superusers = Member.superuserEmails(members);
        notifications._sendMail(superusers, 'New SoCraTes Waitinglist Entry', jade.renderFile(filenameSuperuser, options));
      });
    });
  },

  paymentConfirmation: function (memberID) {
    memberstore.getMemberForId(memberID, function (err, member) {
      if (err || !member) { return logger.error(err); }
      var options = renderingOptions(member);
      var filename = path.join(__dirname, 'jade/paymentConfirmation.jade');
      var receivers = [member.email()];
      notifications._sendMail(receivers, 'SoCraTes Payment Confirmation', jade.renderFile(filename, options));
      memberstore.allMembers(function (err, members) {
        if (err || !members) { return logger.error(err); }
        var superusers = Member.superuserEmails(members);
        notifications._sendMail(superusers, 'SoCraTes Payment for ' + member.nickname(), jade.renderFile(filename, options));
      });
    });
  },

  freePaymentConfirmation: function (memberID, amount) {
    memberstore.getMemberForId(memberID, function (err, member) {
      if (err || !member) { return logger.error(err); }
      var options = renderingOptions(member);
      options.amount = amount;
      var filename = path.join(__dirname, 'jade/freePaymentConfirmation.jade');
      var receivers = [member.email()];
      notifications._sendMail(receivers, 'SoCraTes Payment Receipt', jade.renderFile(filename, options));
    });
  }

};
