"use strict";

require("./configure"); // initializing parameters
var _ = require('underscore');
//var moment = require('moment');

var conf = require('nconf');

console.log('Hallo');
var persistence = conf.get('beans').get('activitiesPersistence');
var Activity = conf.get('beans').get('activity');

persistence.list({startUnix: 1}, function (err, activities) {
  var result = _.map(activities, function (record) {
    delete record.startUnix;
    return new Activity(record);
  });
  persistence.saveAll(result, function () {
    console.log(result);
  });
});
