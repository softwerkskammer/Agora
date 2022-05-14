const async = require("async");
const { DateTime } = require("luxon");
const conf = require("simple-configure");
const logger = require("winston").loggers.get("application");

const beans = conf.get("beans");
const groupsService = beans.get("groupsService");
const groupsAndMembersService = beans.get("groupsAndMembersService");
const activitiesService = beans.get("activitiesService");
const membersService = beans.get("membersService");
const icalService = beans.get("icalService");
const groupstore = beans.get("groupstore");
const memberstore = beans.get("memberstore");
const activitystore = beans.get("activitystore");
const Message = beans.get("message");
const Group = beans.get("group");
const misc = beans.get("misc");

const mailtransport = beans.get("mailtransport");

function sendMail(message, type, callback) {
  mailtransport.sendMail(message, type, conf.get("sender-address"), conf.get("include-footer"), callback);
}

function activityMarkdown(activity, language) {
  let markdown =
    activity.description() +
    "\n\n**Datum:** " +
    activity
      .startDateTime()
      .setLocale(language || "de")
      .toLocaleString(DateTime.DATETIME_FULL) +
    "\n\n**Ort:** " +
    activity.location();
  if (activity.hasDirection()) {
    markdown = markdown + "\n\n**Wegbeschreibung:**\n\n" + activity.direction();
  }
  return markdown;
}

module.exports = {
  activityMarkdown,

  dataForShowingMessageForActivity: function (activityURL, language, globalCallback) {
    async.parallel(
      {
        activity: (callback) => activitiesService.getActivityWithGroupAndParticipants(activityURL, callback),
        groups: async.asyncify(groupstore.allGroups),
      },
      (err, results) => {
        if (err || !results.activity) {
          return globalCallback(err);
        }
        const activity = results.activity;
        const invitationGroup = results.groups.find((group) => group.id === activity.assignedGroup());
        const regionalgroups = groupsService.markGroupsSelected([invitationGroup], Group.regionalsFrom(results.groups));
        const themegroups = groupsService.markGroupsSelected([invitationGroup], Group.thematicsFrom(results.groups));

        const message = new Message();
        message.setSubject("Einladung: " + activity.title());
        message.setMarkdown(activityMarkdown(activity, language));
        message.addToButtons({
          text: "Zur Aktivität",
          url: misc.toFullQualifiedUrl("activities", encodeURIComponent(activity.url())),
        });
        const result = {
          message,
          regionalgroups,
          themegroups,
          successURL: "/activities/" + encodeURIComponent(activityURL),
          activity,
        };
        globalCallback(null, result);
      }
    );
  },

  dataForShowingMessageToMember: async function dataForShowingMessageToMember(nickname, callback) {
    try {
      const member = await memberstore.getMember(nickname);
      if (!member) {
        return callback(new Error("Empfänger wurde nicht gefunden."));
      }
      const message = new Message();
      message.setReceiver(member);
      callback(null, { message, successURL: "/members/" + encodeURIComponent(nickname) });
    } catch (e) {
      callback(e);
    }
  },

  sendMailToParticipantsOf: function sendMailToParticipantsOf(activityURL, message, callback) {
    const type = "$t(mailsender.reminder)";
    return activitiesService.getActivityWithGroupAndParticipants(activityURL, (err, activity) => {
      if (err) {
        return callback(err, mailtransport.statusmessageForError(type, err));
      }
      message.setBccToMemberAddresses(activity.participants);
      message.setIcal(icalService.activityAsICal(activity).toString());
      sendMail(message, type, callback);
    });
  },

  sendMailToInvitedGroups: async function sendMailToInvitedGroups(invitedGroups, activityURL, message, callback) {
    const type = "$t(mailsender.invitation)";
    try {
      const groups = await groupsService.getGroups(invitedGroups);
      if (groups.length === 0) {
        return callback(
          null,
          mailtransport.statusmessageForError(type, new Error("Keine der Gruppen wurde gefunden."))
        );
      }
      try {
        const groups1 = await Promise.all(groups.map(groupsAndMembersService.addMembersToGroup));
        message.setBccToGroupMemberAddresses(groups1);
        let activity;
        try {
          activity = await activitystore.getActivity(activityURL);
        } catch (e) {
          // do nothing
        }
        if (activity) {
          message.setIcal(icalService.activityAsICal(activity).toString());
        }
        sendMail(message, type, callback);
      } catch (err1) {
        return callback(err1, mailtransport.statusmessageForError(type, err1));
      }
    } catch (err) {
      callback(err, mailtransport.statusmessageForError(type, err));
    }
  },

  sendMailToMember: async function sendMailToMember(nickname, message, callback) {
    const type = "$t(mailsender.notification)";

    try {
      const member = await memberstore.getMember(nickname);
      if (!member) {
        return callback(null, mailtransport.statusmessageForError(type, new Error("Empfänger wurde nicht gefunden.")));
      }
      message.setReceiver(member);
      sendMail(message, type, callback);
    } catch (e) {
      callback(e, mailtransport.statusmessageForError(type, e));
    }
  },

  sendMailToAllMembers: async function sendMailToAllMembers(message, callback) {
    try {
      const type = "$t(mailsender.notification)";
      const members = await memberstore.allMembers();
      message.setBccToMemberAddresses(members);
      sendMail(message, type, callback);
    } catch (e) {
      return callback(e);
    }
  },

  sendMagicLinkToMember: function sendMagicLinkToMember(member, token, callback) {
    const baseUrl = conf.get("publicUrlPrefix");
    const link = baseUrl + "/auth/magiclink/callback?token=" + encodeURIComponent(token);
    const messageData = {
      markdown:
        "Liebes Softwerkskammer-Mitglied,\n\n [zum Einloggen bitte klicken](" +
        link +
        ") \n\n oder den Link in den Browser kopieren: \n\n" +
        link +
        "\n\n Der Link ist 30 Minuten lang gültig.",
      subject: "Magic Link für die Softwerkskammer",
      sendCopyToSelf: true,
    };
    const message = new Message(messageData, member);
    sendMail(message, "E-Mail", callback);
  },

  sendRegistrationAllowed: function sendRegistrationAllowed(member, activity, waitinglistEntry, callback) {
    const activityFullUrl = misc.toFullQualifiedUrl("activities", encodeURIComponent(activity.url()));
    const markdownGerman =
      'Für die Veranstaltung ["' +
      activity.title() +
      '"](' +
      activityFullUrl +
      ") sind wieder Plätze frei.\n\nDu kannst Dich bis " +
      waitinglistEntry.registrationValidUntil() +
      " Uhr registrieren.";
    const markdownEnglish =
      'There are a few more places for activity ["' +
      activity.title() +
      '"](' +
      activityFullUrl +
      ").\n\nYou can register until " +
      waitinglistEntry.registrationValidUntil() +
      ".";
    const message = new Message();
    message.setReceiver(member);
    message.setSubject('Moving up for / Nachrücken für "' + activity.title() + '"');
    message.setMarkdown(markdownEnglish + "\n\n---\n\n" + markdownGerman);
    message.addToButtons({
      text: "Zur Aktivität",
      url: activityFullUrl,
    });
    sendMail(message, "Nachricht", callback);
  },

  sendResignment: async function sendResignment(markdown, member, callback) {
    const memberUrl = conf.get("publicUrlPrefix") + "/members/" + encodeURIComponent(member.nickname());
    const messageData = {
      markdown:
        member.displayName() +
        " ([" +
        member.nickname() +
        "](" +
        memberUrl +
        ")) möchte gerne austreten.\n\n" +
        markdown,
      subject: "Austrittswunsch",
      sendCopyToSelf: true,
    };
    try {
      const message = new Message(messageData, member);
      const superusers = await membersService.superuserEmails();
      message.setTo(superusers);
      sendMail(message, "E-Mail", callback);
    } catch (e) {
      return callback(e);
    }
  },

  sendMailToContactPersonsOfGroup: async function sendMailToContactPersonsOfGroup(groupId, message, callback) {
    const type = "$t(mailsender.notification)";
    try {
      const groups = await groupsService.getGroups([groupId]);
      if (groups.length !== 1) {
        logger.error(`${groups.length} Gruppen für Id ${groupId} gefunden. Erwarte genau eine Gruppe.`);
        const error = new Error("Das senden der E-Mail ist fehlgeschlagen. Es liegt ein technisches Problem vor.");
        return callback(error, mailtransport.statusmessageForError(type, error));
      }
      if (!groups[0].canTheOrganizersBeContacted()) {
        return callback(
          null,
          mailtransport.statusmessageForError(type, "$t(mailsender.contact_the_organizers_disabled)")
        );
      }
      const organizers = await groupsAndMembersService.getOrganizersOfGroup(groupId);
      if (!organizers.length) {
        return callback(null, mailtransport.statusmessageForError(type, "$t(mailsender.group_has_no_organizers)"));
      }
      message.setSubject(`[Anfrage an Ansprechpartner/Mail to organizers] ${message.subject}`);
      message.setBccToMemberAddresses(organizers);
      sendMail(message, type, callback);
    } catch (groupLoadErr) {
      return callback(groupLoadErr, mailtransport.statusmessageForError(type, groupLoadErr));
    }
  },
};
