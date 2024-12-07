"use strict";
const { DateTime } = require("luxon");
const conf = require("simple-configure");
const logger = require("winston").loggers.get("application");

const beans = conf.get("beans");
const groupsService = require("../groups/groupsService");
const groupsAndMembersService = require("../groupsAndMembers/groupsAndMembersService");
const activitiesService = require("../activities/activitiesService");
const membersService = require("../members/membersService");
const icalService = require("../activities/icalService");
const groupstore = require("../groups/groupstore");
const memberstore = require("../members/memberstore");
const activitystore = require("../activities/activitystore");
const Message = require("./message");
const Group = require("../groups/group");
const misc = require("../commons/misc");

const mailtransport = require("./mailtransport");

async function sendMail(message, type) {
  return mailtransport.sendMail(message, type, conf.get("sender-address"), conf.get("include-footer"));
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

  dataForShowingMessageForActivity: async function (activityURL, language) {
    const [activity, groups] = [
      activitiesService.getActivityWithGroupAndParticipants(activityURL),
      groupstore.allGroups(),
    ];
    if (!activity) {
      return;
    }
    const invitationGroup = groups.find((group) => group.id === activity.assignedGroup());
    const regionalgroups = groupsService.markGroupsSelected([invitationGroup], Group.regionalsFrom(groups));
    const themegroups = groupsService.markGroupsSelected([invitationGroup], Group.thematicsFrom(groups));

    const message = new Message();
    message.setSubject("Einladung: " + activity.title());
    message.setMarkdown(activityMarkdown(activity, language));
    message.addToButtons([
      {
        text: "Zur Aktivität",
        url: misc.toFullQualifiedUrl("activities", encodeURIComponent(activity.url())),
      },
      {
        text: "Gruppe verlassen",
        url: misc.toFullQualifiedUrl("members", "edit/"),
      },
    ]);
    return {
      message,
      regionalgroups,
      themegroups,
      successURL: "/activities/" + encodeURIComponent(activityURL),
      activity,
    };
  },

  dataForShowingMessageToMember: async function dataForShowingMessageToMember(nickname) {
    const member = memberstore.getMember(nickname);
    if (!member) {
      throw new Error("Empfänger wurde nicht gefunden.");
    }
    const message = new Message();
    message.setReceiver(member);
    return { message, successURL: "/members/" + encodeURIComponent(nickname) };
  },

  sendMailToParticipantsOf: async function sendMailToParticipantsOf(activityURL, message) {
    const type = "$t(mailsender.reminder)";
    try {
      const activity = activitiesService.getActivityWithGroupAndParticipants(activityURL);
      message.setBccToMemberAddresses(activity.participants);
      message.setIcal(icalService.activityAsICal(activity).toString());
      return sendMail(message, type);
    } catch (err) {
      return mailtransport.statusmessageForError(type, err);
    }
  },

  sendMailToInvitedGroups: async function sendMailToInvitedGroups(invitedGroups, activityURL, message) {
    const type = "$t(mailsender.invitation)";
    try {
      const groups = groupsService.getGroups(invitedGroups);
      if (groups.length === 0) {
        return mailtransport.statusmessageForError(type, new Error("Keine der Gruppen wurde gefunden."));
      }
      try {
        groups.forEach(groupsAndMembersService.addMembersToGroup);
        message.setBccToGroupMemberAddresses(groups);
        let activity;
        try {
          activity = activitystore.getActivity(activityURL);
        } catch (e) {
          // do nothing
        }
        if (activity) {
          message.setIcal(icalService.activityAsICal(activity).toString());
        }
        return sendMail(message, type);
      } catch (err1) {
        return mailtransport.statusmessageForError(type, err1);
      }
    } catch (err) {
      return mailtransport.statusmessageForError(type, err);
    }
  },

  sendMailToMember: async function sendMailToMember(nickname, message) {
    const type = "$t(mailsender.notification)";

    try {
      const member = memberstore.getMember(nickname);
      if (!member) {
        return mailtransport.statusmessageForError(type, new Error("Empfänger wurde nicht gefunden."));
      }
      message.setReceiver(member);
      return sendMail(message, type);
    } catch (e) {
      return mailtransport.statusmessageForError(type, e);
    }
  },

  sendMailToAllMembers: async function sendMailToAllMembers(message) {
    const type = "$t(mailsender.notification)";
    const members = memberstore.allMembers();
    message.setBccToMemberAddresses(members);
    return sendMail(message, type);
  },

  sendMagicLinkToMember: async function sendMagicLinkToMember(member, token) {
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
    return sendMail(message, "E-Mail");
  },

  sendRegistrationAllowed: async function sendRegistrationAllowed(member, activity, waitinglistEntry) {
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
    return sendMail(message, "Nachricht");
  },

  sendResignment: async function sendResignment(markdown, member) {
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
    const message = new Message(messageData, member);
    const superusers = membersService.superuserEmails();
    message.setTo(superusers);
    return sendMail(message, "E-Mail");
  },

  sendMailToContactPersonsOfGroup: async function sendMailToContactPersonsOfGroup(groupId, message) {
    const type = "$t(mailsender.notification)";
    try {
      const groups = groupsService.getGroups([groupId]);
      if (groups.length !== 1) {
        logger.error(`${groups.length} Gruppen für Id ${groupId} gefunden. Erwarte genau eine Gruppe.`);
        const error = new Error("Das senden der E-Mail ist fehlgeschlagen. Es liegt ein technisches Problem vor.");
        return mailtransport.statusmessageForError(type, error);
      }
      if (!groups[0].canTheOrganizersBeContacted()) {
        return mailtransport.statusmessageForError(type, "$t(mailsender.contact_the_organizers_disabled)");
      }
      const organizers = groupsAndMembersService.getOrganizersOfGroup(groupId);
      if (!organizers.length) {
        return mailtransport.statusmessageForError(type, "$t(mailsender.group_has_no_organizers)");
      }
      message.setSubject(`[Anfrage an Ansprechpartner/Mail to organizers] ${message.subject}`);
      message.setBccToMemberAddresses(organizers);
      return sendMail(message, type);
    } catch (e) {
      return mailtransport.statusmessageForError(type, e);
    }
  },
};
