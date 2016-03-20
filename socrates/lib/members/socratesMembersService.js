'use strict';

var _ = require('lodash');
var R = require('ramda');
var async = require('async');

var beans = require('simple-configure').get('beans');
var activitystore = beans.get('activitystore');
var eventstoreService = beans.get('eventstoreService');
var socratesConstants = beans.get('socratesConstants');

module.exports = {

  participationStatus: function (subscriber, callback) {
    function containsSoCraTes(activities) {
      return !!_.find(activities, 'state.isSoCraTes');
    }

    // examine the old SoCraTes conferences:
    activitystore.activitiesForGroupIdsAndRegisteredMemberId([], subscriber.id(), false, function (err1, pastActivities) {
      if (err1) { return callback(err1); }
      if (containsSoCraTes(pastActivities)) {
        return callback(null, true);
      }

      // examine the new eventsourced SoCraTes conferences (starting with 2016):
      var eventsourcedSoCraTesYears = R.range(2016, socratesConstants.currentYear + 1);
      async.map(eventsourcedSoCraTesYears, function (year, cb) {
          eventstoreService.getRegistrationReadModel(socratesConstants.urlPrefix + year, function (err, readModel) {
            if (err || !readModel) { return cb(null, false); }
            return cb(null, readModel.isAlreadyRegistered(subscriber.id()));
          });
        },
        function (err, results) {
          var participatedInEventsourcedSoCraTes;
          if (err || !results) {
            participatedInEventsourcedSoCraTes = false;
          } else {
            participatedInEventsourcedSoCraTes = R.reduce(function (acc, elem) {
              return acc || elem;
            }, false, results);
          }
          callback(null, participatedInEventsourcedSoCraTes);
        });
    });

  }
};
