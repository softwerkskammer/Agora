'use strict';

const conf = require('simple-configure');
const logger = require('winston').loggers.get('transactions');
const pug = require('pug');
const path = require('path');

const beans = conf.get('beans');
const memberstore = beans.get('memberstore');
const subscriberstore = beans.get('subscriberstore');
const subscriberService = beans.get('subscriberService');
const socratesConstants = beans.get('socratesConstants');
const sendBulkMail = beans.get('mailtransport').sendBulkMail;

function sendMail(params) {
  sendBulkMail(params.receivers, params.subject, params.html, params.fromName, params.fromAddress, params.callback);
}

function renderingOptions(member) {
  return {
    pretty: true,
    member,
    url: conf.get('publicUrlPrefix'),
    socratesConstants
  };
}

function notifyConcernedParties(params, self) {
  const options = renderingOptions(params.member);
  options.bookingdetails = params.bookingdetails;
  let filename = path.join(__dirname, 'pug/' + params.participantFilename + '.pug');
  sendMail({
    fromName: 'SoCraTes Notifications',
    fromAddress: self.registrationListEmailAddress(),
    receivers: params.receivers || [params.member.email()],
    subject: params.participantSubject,
    html: pug.renderFile(filename, options)
  });

  let receivers = self.registrationListEmailAddress();
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
  newSoCraTesMemberRegistered: function newSoCraTesMemberRegistered(member) {
    const receivers = this.registrationListEmailAddress();
    if (!receivers) { return logger.error('no receivers for sending mail'); }
    subscriberstore.allSubscribers((err1, subscribers) => {
      if (err1 || !subscribers) { return logger.error(err1); }
      const options = renderingOptions(member);
      options.count = subscribers.length;
      const filename = path.join(__dirname, 'pug/newmembertemplate.pug');
      sendMail({
        fromName: 'SoCraTes Notifications',
        fromAddress: conf.get('sender-address'),
        receivers: [receivers],
        subject: 'Neuer Interessent',
        html: pug.renderFile(filename, options)
      });
    });
  },

  newParticipant: function newParticipant(memberID, bookingdetails) {
    memberstore.getMemberForId(memberID, (err, member) => {
      if (err || !member) { return logger.error(err); }
      const params = {
        member,
        bookingdetails,
        participantFilename: 'registrationConfirmation',
        participantSubject: 'SoCraTes Registration Confirmation',
        organizersFilename: 'superuserRegistrationNotification',
        organizersSubject: 'New SoCraTes Registration'
      };
      notifyConcernedParties(params, this);
    });
  },

  changedDuration: function changedDuration(member, bookingdetails) {
    const params = {
      member,
      bookingdetails,
      participantFilename: 'changedRegistration',
      participantSubject: 'SoCraTes Change of Length of Stay',
      organizersFilename: 'superuserRegistrationNotification',
      organizersSubject: 'Change in SoCraTes Registration - Duration'
    };
    notifyConcernedParties(params, this);
  },

  changedResource: function changedResource(member, bookingdetails) {
    const params = {
      member,
      bookingdetails,
      participantFilename: 'changedRegistration',
      participantSubject: 'SoCraTes Change of Room Option',
      organizersFilename: 'superuserRegistrationNotification',
      organizersSubject: 'Change in SoCraTes Registration - Resource'
    };
    notifyConcernedParties(params, this);
  },

  changedWaitinglist: function changedWaitinglist(member, bookingdetails) {
    const params = {
      member,
      bookingdetails,
      participantFilename: 'changedWaitinglist',
      participantSubject: 'SoCraTes Waitinglist Change of Room Option',
      organizersFilename: 'superuserWaitinglistNotification',
      organizersSubject: 'Change in SoCraTes Waitinglist - Resource'
    };
    notifyConcernedParties(params, this);
  },

  removedFromParticipants: function removedFromParticipants(member) {
    const params = {
      member,
      bookingdetails: {resourceKind: 'participant list'},
      participantFilename: 'removalNotification',
      participantSubject: 'SoCraTes - Removal from Participant List',
      organizersFilename: 'superuserRemovalNotification',
      organizersSubject: 'Change in SoCraTes Registration - Removal from Participants'
    };
    notifyConcernedParties(params, this);
  },

  removedFromWaitinglist: function removedFromWaitinglist(member) {
    const params = {
      member,
      bookingdetails: {resourceKind: 'waitinglist'},
      participantFilename: 'removalNotification',
      participantSubject: 'SoCraTes - Removal from Waitinglist',
      organizersFilename: 'superuserRemovalNotification',
      organizersSubject: 'Change in SoCraTes Registration - Removal from Waitinglist'
    };
    notifyConcernedParties(params, this);
  },

  newWaitinglistEntry: function newWaitinglistEntry(memberID, bookingdetails) {
    memberstore.getMemberForId(memberID, (err, member) => {
      if (err || !member) { return logger.error(err); }
      const params = {
        member,
        bookingdetails,
        participantFilename: 'waitinglistConfirmation',
        participantSubject: 'SoCraTes Waitinglist Confirmation',
        organizersFilename: 'superuserWaitinglistNotification',
        organizersSubject: 'New SoCraTes Waitinglist Entry'
      };
      notifyConcernedParties(params, this);
    });
  },

  addedParticipantPair: function addedParticipantPair(participant1, participant2) {
    const params = {
      receivers: [participant1.email(), participant2.email()],
      bookingdetails: {participant1, participant2},
      participantFilename: 'roomPairConfirmation',
      participantSubject: 'SoCraTes Room Sharing Confirmation',
      organizersFilename: 'superuserRoomPairNotification',
      organizersSubject: 'New SoCraTes Room Pair'
    };
    notifyConcernedParties(params, this);
  },

  removedParticipantPair: function removedParticipantPair(participant1, participant2) {
    const params = {
      receivers: [participant1.email(), participant2.email()],
      bookingdetails: {participant1, participant2},
      participantFilename: 'roomPairRemoval',
      participantSubject: 'SoCraTes Room Pair Removal',
      organizersFilename: 'superuserRoomPairRemovalNotification',
      organizersSubject: 'Removed SoCraTes Room Pair'
    };
    notifyConcernedParties(params, this);
  },

  wikiChanges: function wikiChanges(changes, callback) {
    const options = {
      directories: changes.sort(change => change.dir)
    };
    Object.defaults(options, renderingOptions());
    subscriberService.emailAddressesForWikiNotifications((err1, emails) => {
      if (err1 || emails.length === 0) { return callback(err1); }
      const filename = path.join(__dirname, 'pug/wikichangetemplate.pug');
      sendMail({
        fromName: 'SoCraTes Notifications',
        fromAddress: this.infoListEmailAddress(),
        receivers: emails,
        subject: 'SoCraTes Wiki Changes',
        html: pug.renderFile(filename, options),
        callback
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
