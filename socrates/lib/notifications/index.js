'use strict';

var conf = require('simple-configure');
var logger = require('winston').loggers.get('transactions');
var pug = require('pug');
var path = require('path');
var _ = require('lodash');

var beans = conf.get('beans');
var memberstore = beans.get('memberstore');
var subscriberstore = beans.get('subscriberstore');
var subscriberService = beans.get('subscriberService');
var socratesConstants = beans.get('socratesConstants');
var sendBulkMail = beans.get('mailtransport').sendBulkMail;

function sendMail(params) {
  sendBulkMail(params.receivers, params.subject, params.html, params.fromName, params.fromAddress, params.callback);
}

function renderingOptions(member) {
  return {
    pretty: true,
    member: member,
    url: conf.get('publicUrlPrefix'),
    socratesConstants: socratesConstants
  };
}

function notifyConcernedParties(params, self) {
  var options = renderingOptions(params.member);
  options.bookingdetails = params.bookingdetails;
  var filename = path.join(__dirname, 'pug/' + params.participantFilename + '.pug');
  sendMail({
    fromName: 'SoCraTes Notifications',
    fromAddress: self.registrationListEmailAddress(),
    receivers: [params.member.email()],
    subject: params.participantSubject,
    html: pug.renderFile(filename, options)
  });

  var receivers = self.registrationListEmailAddress();
  if (!receivers) { return logger.error('no receivers for sending mail'); }
  filename = path.join(__dirname, 'pug/' + params.organizersFilename + '.pug');
  sendMail({
    fromName: 'SoCraTes Notifications',
    fromAddress: conf.get('sender-address'),
    receivers: [receivers],
    subject: params.organizersSubject,
    html: pug.renderFile(filename, options)
  });
}

module.exports = {
  newSoCraTesMemberRegistered: function (member) {
    var receivers = this.registrationListEmailAddress();
    if (!receivers) { return logger.error('no receivers for sending mail'); }
    subscriberstore.allSubscribers(function (err1, subscribers) {
      if (err1 || !subscribers) { return logger.error(err1); }
      var options = renderingOptions(member);
      options.count = subscribers.length;
      var filename = path.join(__dirname, 'pug/newmembertemplate.pug');
      sendMail({
        fromName: 'SoCraTes Notifications',
        fromAddress: conf.get('sender-address'),
        receivers: [receivers],
        subject: 'Neuer Interessent',
        html: pug.renderFile(filename, options)
      });
    });
  },

  newParticipant: function (memberID, bookingdetails) {
    const self = this;
    memberstore.getMemberForId(memberID, function (err, member) {
      if (err || !member) { return logger.error(err); }
      var params = {
        member: member,
        bookingdetails: bookingdetails,
        participantFilename: 'registrationConfirmation',
        participantSubject: 'SoCraTes Registration Confirmation',
        organizersFilename: 'superuserRegistrationNotification',
        organizersSubject: 'New SoCraTes Registration'
      };
      notifyConcernedParties(params, self);
    });
  },

  changedDuration: function (member, bookingdetails) {
    const self = this;
    var params = {
      member: member,
      bookingdetails: bookingdetails,
      participantFilename: 'changedRegistration',
      participantSubject: 'SoCraTes Change of Length of Stay',
      organizersFilename: 'superuserRegistrationNotification',
      organizersSubject: 'Change in SoCraTes Registration - Duration'
    };
    notifyConcernedParties(params, self);
  },

  changedResource: function (member, bookingdetails) {
    const self = this;
    var params = {
      member: member,
      bookingdetails: bookingdetails,
      participantFilename: 'changedRegistration',
      participantSubject: 'SoCraTes Change of Room Option',
      organizersFilename: 'superuserRegistrationNotification',
      organizersSubject: 'Change in SoCraTes Registration - Resource'
    };
    notifyConcernedParties(params, self);
  },

  changedWaitinglist: function (member, bookingdetails) {
    const self = this;
    var params = {
      member: member,
      bookingdetails: bookingdetails,
      participantFilename: 'changedWaitinglist',
      participantSubject: 'SoCraTes Waitinglist Change of Room Option',
      organizersFilename: 'superuserWaitinglistNotification',
      organizersSubject: 'Change in SoCraTes Waitinglist - Resource'
    };
    notifyConcernedParties(params, self);
  },

  removedFromParticipants: function (member) {
    const self = this;
    var params = {
      member: member,
      bookingdetails: {resourceKind: 'participant list'},
      participantFilename: 'removalNotification',
      participantSubject: 'SoCraTes - Removal from Participant List',
      organizersFilename: 'superuserRemovalNotification',
      organizersSubject: 'Change in SoCraTes Registration - Removal from Participants'
    };
    notifyConcernedParties(params, self);
  },

  removedFromWaitinglist: function (member) {
    const self = this;
    var params = {
      member: member,
      bookingdetails: {resourceKind: 'waitinglist'},
      participantFilename: 'removalNotification',
      participantSubject: 'SoCraTes - Removal from Waitinglist',
      organizersFilename: 'superuserRemovalNotification',
      organizersSubject: 'Change in SoCraTes Registration - Removal from Waitinglist'
    };
    notifyConcernedParties(params, self);
  },

  newWaitinglistEntry: function (memberID, bookingdetails) {
    const self = this;
    memberstore.getMemberForId(memberID, function (err, member) {
      if (err || !member) { return logger.error(err); }
      var params = {
        member: member,
        bookingdetails: bookingdetails,
        participantFilename: 'waitinglistConfirmation',
        participantSubject: 'SoCraTes Waitinglist Confirmation',
        organizersFilename: 'superuserWaitinglistNotification',
        organizersSubject: 'New SoCraTes Waitinglist Entry'
      };
      notifyConcernedParties(params, self);
    });
  },

  wikiChanges: function (changes, callback) {
    const self = this;
    var options = {
      directories: _.sortBy(changes, 'dir')
    };
    _.defaults(options, renderingOptions());
    subscriberService.emailAddressesForWikiNotifications(function (err1, emails) {
      if (err1 || emails.length === 0) { return callback(err1); }
      var filename = path.join(__dirname, 'pug/wikichangetemplate.pug');
      sendMail({
        fromName: 'SoCraTes Notifications',
        fromAddress: self.infoListEmailAddress(),
        receivers: emails,
        subject: 'SoCraTes Wiki Changes',
        html: pug.renderFile(filename, options),
        callback: callback
      });
    });
  },

  registrationListEmailAddress: function registrationListEmailAddress() {
    // public for stubbing in tests
    return conf.get('registrationListEmailAddress');
  },
  infoListEmailAddress: function infoListEmailAddress() {
    // public for stubbing in tests
    return conf.get('infoListEmailAddress') || this.registrationListEmailAddress();
  },
  notificationListEmailAddress: function notificationListEmailAddress() {
    // public for stubbing in tests (Future Use)
    return conf.get('notificationListEmailAddress') || this.infoListEmailAddress();
  }

};
