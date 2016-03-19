'use strict';

var _ = require('lodash');
var beans = require('simple-configure').get('beans');
var activitystore = beans.get('activitystore');

module.exports = {

  participationStatus: function (subscriber, callback) {
    function containsSoCraTes(activities) {
      return !!_.find(activities, 'state.isSoCraTes');
    }

    activitystore.activitiesForGroupIdsAndRegisteredMemberId([], subscriber.id(), true, function (err, upcomingActivities) {
      if (err) { return callback(err); }
      activitystore.activitiesForGroupIdsAndRegisteredMemberId([], subscriber.id(), false, function (err1, pastActivities) {
        if (err1) { return callback(err1); }
        callback(null, containsSoCraTes(upcomingActivities.concat(pastActivities)));
      });
    });

  }
};
