"use strict";

var nconf = require('../configureForTest');
var moment = require('moment-timezone');
var expect = require('chai').expect;
var persistence = require('../../lib/persistence/persistence')('teststore');

var beans = nconf.get('beans');
var fieldHelpers = beans.get('fieldHelpers');
var Activity = beans.get('activity');

var activityUrl = 'urlOfTheActivity';

var emptyActivity = new Activity({id: "activityId", title: 'Title of the Activity', description: 'description1', assignedGroup: 'groupname',
  location: 'location1', direction: 'direction1', startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013'),
  url: activityUrl, owner: 'owner', resources: {default: {_registeredMembers: [], _registrationOpen: true  }}});


var getActivity = function (url, callback) {
  persistence.getByField({url: url}, function (err, activityState) {
    callback(err, new Activity(activityState));
  });
};
var saveActivity = function (activity, callback) {
  persistence.saveWithVersion(activity.state, callback);
};


describe('Activity', function () {

  beforeEach(function (done) { // if this fails, you need to start your mongo DB
    persistence.drop(function () {
      // save our sample activity
      saveActivity(emptyActivity, function (err) {
        done(err);
      });
    });
  });

  // Note: This test only shows the general mechanism of avoiding racing conditions with the help of version numbers.
  // This does not mean that the activity code already implements this!
  it('has a racing condition when saving two participants in quick succession', function (done) {
    // load activity for the first time:
    getActivity(activityUrl, function (err, activity1) {
      // add member to loaded instance:
      activity1.resourceNamed("default").addMemberId("memberId1", moment());
      // load activity for the second time:
      getActivity(activityUrl, function (err, activity2) {
        // add member to the second instance:
        activity2.resourceNamed("default").addMemberId("memberId2", moment());
        // save first instance:
        saveActivity(activity1, function () {
          // load it again:
          getActivity(activityUrl, function (err, activity) {
            expect(activity.resourceNamed('default').registeredMembers(), "First registered member is stored").to.contain("memberId1");
            // save second instance:
            saveActivity(activity2, function (err) {
              expect(err.message).to.equal("Conflicting versions."); // Conflict is discovered
              // repeat loading and adding:
              getActivity(activityUrl, function (err, activity2) {
                activity2.resourceNamed("default").addMemberId("memberId2", moment());
                saveActivity(activity2, function () {
                  // load the resulting activity
                  getActivity(activityUrl, function (err, activity) {
                    expect(activity.resourceNamed('default').registeredMembers(), "Second registered member is stored").to.contain("memberId2");
                    // Bug #578: This expectation should work
                    expect(activity.resourceNamed('default').registeredMembers(), "First registered member is still there").to.contain("memberId1");
                    done(err);
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
