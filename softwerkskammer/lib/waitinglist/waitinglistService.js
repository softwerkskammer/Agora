const beans = require("simple-configure").get("beans");
const memberstore = beans.get("memberstore");
const activitystore = beans.get("activitystore");
const mailsenderService = beans.get("mailsenderService");
const CONFLICTING_VERSIONS = beans.get("constants").CONFLICTING_VERSIONS;

module.exports = {
  waitinglistFor: function waitinglistFor(activityUrl) {
    const activity = activitystore.getActivity(activityUrl);
    return activity.allWaitinglistEntries().map((waitinglistEntry) => {
      const member = memberstore.getMemberForId(waitinglistEntry.registrantId());
      waitinglistEntry.registrantNickname = member.nickname();
      return waitinglistEntry;
    });
  },

  saveWaitinglistEntry: function saveWaitinglistEntry(args) {
    const self = this;
    const member = memberstore.getMember(args.nickname);
    const activity = activitystore.getActivity(args.activityUrl);
    activity.addToWaitinglist(member.id(), Date.now());
    try {
      activitystore.saveActivity(activity);
    } catch (err1) {
      if (err1 && err1.message === CONFLICTING_VERSIONS) {
        // we try again because of a racing condition during save:
        return self.saveWaitinglistEntry(args);
      }
      throw err1;
    }
  },

  allowRegistrationForWaitinglistEntry: function allowRegistrationForWaitinglistEntry(args) {
    const self = this;
    const member = memberstore.getMember(args.nickname);
    const activity = activitystore.getActivity(args.activityUrl);

    if (!member || !activity) {
      return;
    }
    let entry = activity.waitinglistEntryFor(member.id());
    if (!entry) {
      return;
    }
    entry.setRegistrationValidityFor(args.hoursstring);
    try {
      activitystore.saveActivity(activity);
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
