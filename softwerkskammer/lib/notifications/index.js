/* eslint no-underscore-dangle: 0 */

const R = require("ramda");
const conf = require("simple-configure");

const beans = conf.get("beans");
const groupsAndMembers = beans.get("groupsAndMembersService");
const memberstore = beans.get("memberstore");
const Member = beans.get("member");
const sendBulkMail = beans.get("mailtransport").sendBulkMail;
const logger = require("winston").loggers.get("transactions");
const pug = require("pug");
const path = require("path");

function addPrettyAndUrlTo(object) {
  object.pretty = true; // makes the generated html nicer, in case someone looks at the mail body
  object.url = conf.get("publicUrlPrefix");
}

function sendMail(emailAddresses, subject, html, callback) {
  const fromName = conf.get("sender-name") || "Softwerkskammer Benachrichtigungen";
  sendBulkMail(emailAddresses, subject, html, fromName, conf.get("sender-address"), callback);
}

async function activityParticipation(activity, visitorID, ressourceName, content, type, callback) {
  try {
    const [group, owner, visitor] = await Promise.all([
      groupsAndMembers.getGroupAndMembersForList(activity.assignedGroup()),
      memberstore.getMemberForId(activity.owner()),
      memberstore.getMemberForId(visitorID),
    ]);
    const organizers = (group.members || []).filter((member) => group.organizers.includes(member.id()));
    const organizersEmails = organizers.map((member) => member.email());
    if (owner) {
      organizersEmails.push(owner.email());
    }
    if (R.isEmpty(organizersEmails)) {
      return;
    }
    const renderingOptions = {
      activity,
      ressourceName,
      content,
      count: activity.allRegisteredMembers().length,
      totalcount: activity.allRegisteredMembers().length,
      visitor: visitor,
    };
    addPrettyAndUrlTo(renderingOptions);
    const filename = path.join(__dirname, "pug/activitytemplate.pug");
    sendMail(organizersEmails, type, pug.renderFile(filename, renderingOptions), callback);
  } catch (e) {
    logger.error(e);
    callback(e);
  }
}

module.exports = {
  visitorRegistration: function visitorRegistration(activity, visitorID, callback) {
    activityParticipation(
      activity,
      visitorID,
      "",
      "hat sich ein neuer Besucher angemeldet",
      "Neue Anmeldung für Aktivität",
      callback
    );
  },

  visitorUnregistration: function visitorUnregistration(activity, visitorID, callback) {
    activityParticipation(
      activity,
      visitorID,
      "",
      "hat sich ein Besucher abgemeldet",
      "Abmeldung für Aktivität",
      callback
    );
  },

  waitinglistAddition: function waitinglistAddition(activity, visitorID, callback) {
    activityParticipation(
      activity,
      visitorID,
      "",
      "hat sich jemand auf die Warteliste eingetragen",
      "Zugang auf Warteliste",
      callback
    );
  },

  waitinglistRemoval: function waitinglistRemoval(activity, visitorID, callback) {
    activityParticipation(
      activity,
      visitorID,
      "",
      "hat sich jemand von der Warteliste entfernt",
      "Streichung aus Warteliste",
      callback
    );
  },

  wikiChanges: async function wikiChanges(changes, callback) {
    try {
      const members = await memberstore.allMembers();
      const renderingOptions = {
        directories: R.sortBy(R.prop("dir"), changes),
      };
      addPrettyAndUrlTo(renderingOptions);
      const filename = path.join(__dirname, "pug/wikichangetemplate.pug");
      const receivers = R.union(Member.superuserEmails(members), Member.wikiNotificationMembers(members));
      sendMail(receivers, "Wiki Änderungen", pug.renderFile(filename, renderingOptions), callback);
    } catch (e) {
      return callback(e);
    }
  },

  newMemberRegistered: async function newMemberRegistered(member, subscriptions) {
    const members = await memberstore.allMembers();
    const renderingOptions = {
      member,
      groups: subscriptions,
      count: members.length,
    };
    addPrettyAndUrlTo(renderingOptions);
    const filename = path.join(__dirname, "pug/newmembertemplate.pug");
    const receivers = Member.superuserEmails(members);
    sendMail(receivers, "Neues Mitglied", pug.renderFile(filename, renderingOptions));
  },
};
