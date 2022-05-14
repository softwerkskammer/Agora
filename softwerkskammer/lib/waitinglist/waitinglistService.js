const beans = require("simple-configure").get("beans");
const memberstore = beans.get("memberstore");
const activitystore = beans.get("activitystore");
const mailsenderService = beans.get("mailsenderService");
const CONFLICTING_VERSIONS = beans.get("constants").CONFLICTING_VERSIONS;

module.exports = {
  waitinglistFor: async function waitinglistFor(activityUrl, globalCallback) {
    try {
      const activity = await activitystore.getActivity(activityUrl);
      const entries = await Promise.all(
        activity.allWaitinglistEntries().map(async (waitinglistEntry) => {
          const member = await memberstore.getMemberForId(waitinglistEntry.registrantId());
          waitinglistEntry.registrantNickname = member.nickname();
          return waitinglistEntry;
        })
      );
      globalCallback(null, entries);
    } catch (e) {
      globalCallback(e);
    }
  },

  saveWaitinglistEntry: async function saveWaitinglistEntry(args, callback) {
    try {
      const self = this;
      const [member, activity] = await Promise.all([
        memberstore.getMember(args.nickname),
        activitystore.getActivity(args.activityUrl),
      ]);
      activity.addToWaitinglist(member.id(), Date.now());
      try {
        await activitystore.saveActivity(activity);
        callback();
      } catch (err1) {
        if (err1 && err1.message === CONFLICTING_VERSIONS) {
          // we try again because of a racing condition during save:
          return self.saveWaitinglistEntry(args, callback);
        }
        return callback(err1);
      }
    } catch (e) {
      callback(e);
    }
  },

  allowRegistrationForWaitinglistEntry: async function allowRegistrationForWaitinglistEntry(args, outerCallback) {
    try {
      const self = this;
      const [member, activity] = await Promise.all([
        memberstore.getMember(args.nickname),
        activitystore.getActivity(args.activityUrl),
      ]);
      if (!member || !activity) {
        return outerCallback();
      }
      let entry = activity.waitinglistEntryFor(member.id());
      if (!entry) {
        return outerCallback(null);
      }
      entry.setRegistrationValidityFor(args.hoursstring);
      try {
        await activitystore.saveActivity(activity);
        mailsenderService.sendRegistrationAllowed(member, activity, entry, outerCallback);
      } catch (err1) {
        if (err1 && err1.message === CONFLICTING_VERSIONS) {
          // we try again because of a racing condition during save:
          return self.allowRegistrationForWaitinglistEntry(args, outerCallback);
        }
        if (err1) {
          return outerCallback(err1);
        }
      }
    } catch (e) {
      outerCallback(e);
    }
  },
};
