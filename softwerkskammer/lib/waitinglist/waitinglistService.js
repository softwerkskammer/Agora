const async = require("async");

const beans = require("simple-configure").get("beans");
const memberstore = beans.get("memberstore");
const activitystore = beans.get("activitystore");
const mailsenderService = beans.get("mailsenderService");
const CONFLICTING_VERSIONS = beans.get("constants").CONFLICTING_VERSIONS;

module.exports = {
  waitinglistFor: function waitinglistFor(activityUrl, globalCallback) {
    activitystore.getActivity(activityUrl, (err, activity) => {
      if (err) {
        return globalCallback(err);
      }
      async.map(
        activity.allWaitinglistEntries(),
        async.asyncify(async (waitinglistEntry) => {
          const member = memberstore.getMemberForId(waitinglistEntry.registrantId());
          waitinglistEntry.registrantNickname = member.nickname();
          return waitinglistEntry;
        }),
        globalCallback
      );
    });
  },

  saveWaitinglistEntry: function saveWaitinglistEntry(args, callback) {
    const self = this;
    async.parallel(
      {
        member: async.asyncify(async () => memberstore.getMember(args.nickname)),
        activity: (cb) => activitystore.getActivity(args.activityUrl, cb),
      },
      (err, results) => {
        if (err || !results.member || !results.activity) {
          return callback(err);
        }
        results.activity.addToWaitinglist(results.member.id(), Date.now());
        activitystore.saveActivity(results.activity, function (err1) {
          if (err1 && err1.message === CONFLICTING_VERSIONS) {
            // we try again because of a racing condition during save:
            return self.saveWaitinglistEntry(args, callback);
          }
          return callback(err1);
        });
      }
    );
  },

  allowRegistrationForWaitinglistEntry: function allowRegistrationForWaitinglistEntry(args, outerCallback) {
    const self = this;
    async.parallel(
      {
        member: async.asyncify(async () => memberstore.getMember(args.nickname)),
        activity: (callback) => activitystore.getActivity(args.activityUrl, callback),
      },
      (err, results) => {
        if (err || !results.member || !results.activity) {
          return outerCallback(err);
        }
        let entry = results.activity.waitinglistEntryFor(results.member.id());
        if (!entry) {
          return outerCallback(null);
        }
        entry.setRegistrationValidityFor(args.hoursstring);
        activitystore.saveActivity(results.activity, (err1) => {
          if (err1 && err1.message === CONFLICTING_VERSIONS) {
            // we try again because of a racing condition during save:
            return self.allowRegistrationForWaitinglistEntry(args, outerCallback);
          }
          if (err1) {
            return outerCallback(err1);
          }
          mailsenderService.sendRegistrationAllowed(results.member, results.activity, entry, outerCallback);
        });
      }
    );
  },
};
