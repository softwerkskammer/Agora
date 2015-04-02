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

module.exports = {
  newSoCraTesMemberRegistered: function (member) {
    memberstore.allMembers(function (err, members) {
      if (err || !members) { return logger.error(err); }
      subscriberstore.allSubscribers(function (err, subscribers) {
        if (err || !subscribers) { return logger.error(err); }
        var renderingOptions = {
          pretty: true,
          member: member,
          url: conf.get('publicUrlPrefix'),
          count: subscribers.length
        };
        var filename = path.join(__dirname, 'jade/newmembertemplate.jade');
        var receivers = Member.superuserEmails(members);
        notifications._sendMail(receivers, 'Neuer Interessent', jade.renderFile(filename, renderingOptions));
      });
    });
  },

  newParticipant: function (memberID, bookingdetails) {
    memberstore.getMemberForId(memberID, function (err, member) {
      if (err || !member) { return logger.error(err); }
      var renderingOptions = {
        pretty: true,
        member: member,
        url: conf.get('publicUrlPrefix'),
        bookingdetails: bookingdetails
      };
      var filename = path.join(__dirname, 'jade/registrationConfirmation.jade');
      var receivers = [member.email()];
      notifications._sendMail(receivers, 'SoCraTes Registration Confirmation', jade.renderFile(filename, renderingOptions));

    });
  }
};
