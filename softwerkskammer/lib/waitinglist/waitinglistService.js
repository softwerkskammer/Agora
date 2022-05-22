const beans = require("simple-configure").get("beans");
const memberstore = beans.get("memberstore");
const activitystore = beans.get("activitystore");
const mailsenderService = beans.get("mailsenderService");
const CONFLICTING_VERSIONS = beans.get("constants").CONFLICTING_VERSIONS;

module.exports = {
  waitinglistFor: async function waitinglistFor(activityUrl) {
    const activity = await activitystore.getActivity(activityUrl);
    return await Promise.all(
      activity.allWaitinglistEntries().map(async (waitinglistEntry) => {
        const member = await memberstore.getMemberForId(waitinglistEntry.registrantId());
        waitinglistEntry.registrantNickname = member.nickname();
        return waitinglistEntry;
      })
    );
  },

  saveWaitinglistEntry: async function saveWaitinglistEntry(args) {
    const self = this;
    const [member, activity] = await Promise.all([
      memberstore.getMember(args.nickname),
      activitystore.getActivity(args.activityUrl),
    ]);
    activity.addToWaitinglist(member.id(), Date.now());
    try {
      await activitystore.saveActivity(activity);
    } catch (err1) {
      if (err1 && err1.message === CONFLICTING_VERSIONS) {
        // we try again because of a racing condition during save:
        return self.saveWaitinglistEntry(args);
      }
      throw err1;
    }
  },

  allowRegistrationForWaitinglistEntry: async function allowRegistrationForWaitinglistEntry(args) {
    const self = this;
    const [member, activity] = await Promise.all([
      memberstore.getMember(args.nickname),
      activitystore.getActivity(args.activityUrl),
    ]);
    if (!member || !activity) {
      return;
    }
    let entry = activity.waitinglistEntryFor(member.id());
    if (!entry) {
      return;
    }
    entry.setRegistrationValidityFor(args.hoursstring);
    try {
      await activitystore.saveActivity(activity);
      return mailsenderService.sendRegistrationAllowed(member, activity, entry);
    } catch (err1) {
      if (err1 && err1.message === CONFLICTING_VERSIONS) {
        // we try again because of a racing condition during save:
        return self.allowRegistrationForWaitinglistEntry(args);
      }
      if (err1) {
        throw err1;
      }
    }
  },
};
