'use strict';

const R = require('ramda');
const async = require('async');

const conf = require('simple-configure');
const beans = conf.get('beans');
const activitystore = beans.get('activitystore');
const eventstoreService = beans.get('eventstoreService');
const socratesConstants = beans.get('socratesConstants');

module.exports = {

  participationStatus: function (subscriber, callback) {
    function containsSoCraTes(activities) {
      return activities.some(act => act.state.isSoCraTes);
    }

    // examine the old SoCraTes conferences:
    activitystore.activitiesForGroupIdsAndRegisteredMemberId([], subscriber.id(), false, (err1, pastActivities) => {
      if (err1) { return callback(err1); }
      if (containsSoCraTes(pastActivities)) {
        return callback(null, true);
      }

      // examine the new eventsourced SoCraTes conferences (starting with 2016):
      const eventsourcedSoCraTesYears = R.range(2016, socratesConstants.currentYear + 1);
      async.map(eventsourcedSoCraTesYears, (year, cb) => {
          eventstoreService.getRegistrationReadModel(socratesConstants.urlPrefix + year, (err, readModel) => {
            if (err || !readModel) { return cb(null, false); }
            return cb(null, readModel.isAlreadyRegistered(subscriber.id()));
          });
        },
        (err, results) => {
          let participatedInEventsourcedSoCraTes;
          if (err || !results) {
            participatedInEventsourcedSoCraTes = false;
          } else {
            participatedInEventsourcedSoCraTes = R.reduce((acc, elem) => acc || elem, false, results);
          }
          callback(null, participatedInEventsourcedSoCraTes);
        });
    });

  }
};
