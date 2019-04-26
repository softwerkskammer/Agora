const async = require('async');
const {DateTime} = require('luxon');
const conf = require('simple-configure');

const beans = conf.get('beans');
const groupsService = beans.get('groupsService');
const groupsAndMembersService = beans.get('groupsAndMembersService');
const activitiesService = beans.get('activitiesService');
const membersService = beans.get('membersService');
const icalService = beans.get('icalService');
const memberstore = beans.get('memberstore');
const activitystore = beans.get('activitystore');
const Message = beans.get('message');
const Group = beans.get('group');
const misc = beans.get('misc');

const mailtransport = beans.get('mailtransport');

function sendMail(message, type, callback) {
  mailtransport.sendMail(message, type, conf.get('sender-address'), callback);
}

function activityMarkdown(activity, language) {
  let markdown = activity.description() + '\n\n**Datum:** ' + activity.startDateTime().setLocale(language || 'de').toLocaleString(DateTime.DATETIME_FULL) + '\n\n**Ort:** ' + activity.location();
  if (activity.hasDirection()) {
    markdown = markdown + '\n\n**Wegbeschreibung:**\n\n' + activity.direction();
  }
  return markdown;
}

module.exports = {
  activityMarkdown,

  dataForShowingMessageForActivity: function (activityURL, language, globalCallback) {
    async.parallel(
      {
        activity: callback => activitiesService.getActivityWithGroupAndParticipants(activityURL, callback),
        groups: callback => groupsService.getAllAvailableGroups(callback)
      },
      (err, results) => {
        if (err || !results.activity) { return globalCallback(err); }
        const activity = results.activity;
        const invitationGroup = results.groups.find(group => group.id === activity.assignedGroup());
        const regionalgroups = groupsService.combineSubscribedAndAvailableGroups([invitationGroup], Group.regionalsFrom(results.groups));
        const themegroups = groupsService.combineSubscribedAndAvailableGroups([invitationGroup], Group.thematicsFrom(results.groups));

        const message = new Message();
        message.setSubject('Einladung: ' + activity.title());
        message.setMarkdown(activityMarkdown(activity, language));
        message.addToButtons({
          text: 'Zur Aktivität',
          url: misc.toFullQualifiedUrl('activities', encodeURIComponent(activity.url()))
        });
        const result = {
          message,
          regionalgroups,
          themegroups,
          successURL: '/activities/' + encodeURIComponent(activityURL),
          activity
        };
        globalCallback(null, result);
      }
    );
  },

  dataForShowingMessageToMember: function dataForShowingMessageToMember(nickname, callback) {
    memberstore.getMember(nickname, (err, member) => {
      if (err) {return callback(err); }
      if (!member) {return callback(new Error('Empfänger wurde nicht gefunden.')); }
      const message = new Message();
      message.setReceiver(member);
      callback(null, {message, successURL: '/members/' + encodeURIComponent(nickname)});
    });
  },

  sendMailToParticipantsOf: function sendMailToParticipantsOf(activityURL, message, callback) {
    const type = '$t(mailsender.reminder)';
    return activitiesService.getActivityWithGroupAndParticipants(activityURL, (err, activity) => {
      if (err) { return callback(err, mailtransport.statusmessageForError(type, err)); }
      message.setBccToMemberAddresses(activity.participants);
      message.setIcal(icalService.activityAsICal(activity).toString());
      sendMail(message, type, callback);
    });
  },

  sendMailToInvitedGroups: function sendMailToInvitedGroups(invitedGroups, activityURL, message, callback) {
    const type = '$t(mailsender.invitation)';
    return groupsService.getGroups(invitedGroups, (err, groups) => {
      if (err) { return callback(err, mailtransport.statusmessageForError(type, err)); }
      if (groups.length === 0) { return callback(null, mailtransport.statusmessageForError(type, new Error('Keine der Gruppen wurde gefunden.'))); }
      async.map(groups, groupsAndMembersService.addMembersToGroup, (err1, groups1) => {
        if (err1) { return callback(err1, mailtransport.statusmessageForError(type, err1)); }
        message.setBccToGroupMemberAddresses(groups1);
        activitystore.getActivity(activityURL, (err2, activity) => {
          if (activity) {
            message.setIcal(icalService.activityAsICal(activity).toString());
          }
          sendMail(message, type, callback);
        });
      });
    });
  },

  sendMailToMember: function sendMailToMember(nickname, message, callback) {
    const type = '$t(mailsender.notification)';
    return memberstore.getMember(nickname, (err, member) => {
      if (err) {return callback(err, mailtransport.statusmessageForError(type, err)); }
      if (!member) {return callback(null, mailtransport.statusmessageForError(type, new Error('Empfänger wurde nicht gefunden.'))); }
      message.setReceiver(member);
      sendMail(message, type, callback);
    });
  },

  sendMailToAllMembers: function sendMailToAllMembers(message, callback) {
    const type = '$t(mailsender.notification)';
    memberstore.allMembers((err, members) => {
      if (err) { return callback(err, mailtransport.statusmessageForError(type, err)); }
      message.setBccToMemberAddresses(members);
      sendMail(message, type, callback);
    });
  },

  sendMagicLinkToMember: function sendMagicLinkToMember(member, token, callback) {
    const baseUrl = conf.get('publicUrlPrefix');
    const link = baseUrl + '/auth/magiclink/callback?token=' + encodeURIComponent(token);
    const messageData = {
      markdown: 'Liebes Softwerkskammer-Mitglied,\n\n [zum Einloggen bitte klicken](' + link + ') \n\n oder den Link in den Browser kopieren: \n\n' + link + '\n\n Der Link ist 30 Minuten lang gültig.',
      subject: 'Magic Link für die Softwerkskammer',
      sendCopyToSelf: true
    };
    const message = new Message(messageData, member);
    sendMail(message, 'E-Mail', callback);
  },

  sendRegistrationAllowed: function sendRegistrationAllowed(member, activity, waitinglistEntry, callback) {
    const activityFullUrl = misc.toFullQualifiedUrl('activities', encodeURIComponent(activity.url()));
    const markdownGerman = 'Für die Veranstaltung ["' + activity.title() + '"](' + activityFullUrl + ') sind wieder Plätze frei.\n\nDu kannst Dich bis ' +
      waitinglistEntry.registrationValidUntil() + ' Uhr registrieren.';
    const markdownEnglish = 'There are a few more places for activity ["' + activity.title() + '"](' + activityFullUrl + ').\n\nYou can register until ' +
      waitinglistEntry.registrationValidUntil() + '.';
    const message = new Message();
    message.setReceiver(member);
    message.setSubject('Moving up for / Nachrücken für "' + activity.title() + '"');
    message.setMarkdown(markdownEnglish + '\n\n---\n\n' + markdownGerman);
    message.addToButtons({
      text: 'Zur Aktivität',
      url: activityFullUrl
    });
    sendMail(message, 'Nachricht', callback);
  },

  sendResignment: function sendResignment(markdown, member, callback) {
    const memberUrl = conf.get('publicUrlPrefix') + '/members/' + encodeURIComponent(member.nickname());
    const messageData = {
      markdown: member.displayName() + ' ([' + member.nickname() + '](' + memberUrl + ')) möchte gerne austreten.\n\n' + markdown,
      subject: 'Austrittswunsch',
      sendCopyToSelf: true
    };
    const message = new Message(messageData, member);
    membersService.superuserEmails((err, superusers) => {
      if (err) { return callback(err); }
      message.setTo(superusers);
      sendMail(message, 'E-Mail', callback);
    });
  },

  sendMailToContactPersonsOfGroup: function (groupId, message, callback) {
    const type = '$t(mailsender.notification)';
    groupsService.getGroups([groupId], (groupLoadErr, groups) => {
      if (groupLoadErr) { return callback(groupLoadErr, mailtransport.statusmessageForError(type, groupLoadErr)); }
      if (groups.length !== 1) {
        const groupNotFoundError = new Error(`${groups.length} Gruppen für Id ${groupId} gefunden. Erwarte genau eine Gruppe.`);
        return callback(groupNotFoundError, mailtransport.statusmessageForError(type, groupNotFoundError));
      }
      if (!groups[0].canTheOrganizersBeContacted()) {
        return callback(null, mailtransport.statusmessageForError(type, '$t(mailsender.contact_persons_cannot_be_contacted)'));
      }
      groupsAndMembersService.getOrganizersOfGroup(groupId, (err, organizers) => {
        if (err) { return callback(err, mailtransport.statusmessageForError(type, err)); }
        if (!organizers.length) {
          return callback(null, mailtransport.statusmessageForError(type, '$t(mailsender.group_has_no_organizers)'));
        }
        message.setBccToMemberAddresses(organizers);
        sendMail(message, type, callback);
      });
    });
  }

};
