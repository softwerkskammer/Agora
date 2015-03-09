'use strict';

var async = require('async');
var _ = require('lodash');

var beans = require('simple-configure').get('beans');

var activitystore = beans.get('activitystore');
var SoCraTesResource = beans.get('socratesResource');
var groupsService = beans.get('groupsService');
var groupstore = beans.get('groupstore');
var membersService = beans.get('membersService');
var memberstore = beans.get('memberstore');
var notifications = beans.get('notifications');
var fieldHelpers = beans.get('fieldHelpers');
var CONFLICTING_VERSIONS = beans.get('constants').CONFLICTING_VERSIONS;

module.exports = {

  // TODO save days
  startRegistration: function (memberId, registrationTuple, callback) {
    var self = this;
    activitystore.getActivity(registrationTuple.activityUrl, function (err, activity) {
      if (err || !activity) { return callback(err, 'message.title.problem', 'message.content.activities.does_not_exist'); }
      var resource = new SoCraTesResource(activity.resourceNamed(registrationTuple.resourceName));
      if (resource.addMemberId(memberId)) {
        resource.addExpirationTimeFor(memberId);
        return activitystore.saveActivity(activity, function (err) {
          if (err && err.message === CONFLICTING_VERSIONS) {
            // we try again because of a racing condition during save:
            return self.startRegistration(memberId, registrationTuple, callback);
          }
          if (err) { return callback(err); }
          //notifications.visitorRegistration(activity, memberId, resourceName);
          return callback(err);
        });
      }
      return callback(null, 'activities.registration_not_now', 'activities.registration_not_possible');
    });
  }

};
