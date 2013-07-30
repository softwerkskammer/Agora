"use strict";

require("./configure"); // initializing parameters
var _ = require('underscore');

var conf = require('nconf');
var moment = require('moment');

console.log('Hallo');
var persistence = conf.get('beans').get('announcementsPersistence');
var Announcement = conf.get('beans').get('announcement');

persistence.list({fromDate: 1}, function (err, announcements) {
  var result = _.map(announcements, function (record) {
    record.fromUnix = moment(record.fromDate).utc().unix();
    delete record.fromDate;
    if (typeof record.thruDate === 'Integer') {
      record.thruUnix = moment(record.thruDate).utc().unix();
    } else {
      record.thruUnix = moment.unix(record.fromUnix).utc().add('M', 1).unix();
    }
    delete record.thruDate;
    return new Announcement(record);
  });
  persistence.saveAll(result, function () {
    console.log(result);
  });
});
