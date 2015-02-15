'use strict';

// To use this make sure that you have setup the sympa-variables and the ezmlm-variables correctly 

require('./configure'); // initializing parameters
var proxyquire = require('proxyquire');
var async = require('async');
var beans = require('simple-configure').get('beans');
var groupsService = beans.get('groupsService');
var ezmlmAdapter;

var really = process.argv[2];
var doSave = process.argv[3] === 'doSave';

if (!really || really !== 'really') {
  console.log('If you really want to rename the group, append "really" to the command line.');
  console.log('If you really want to save, append "doSave" after "really" to the command line.');
  process.exit();
}

if (doSave) {
  ezmlmAdapter = beans.get('ezmlmAdapter');
} else {
  var ezmlmStub = {
    defaultOptions: {},
    createListNamed: function (list, defaultOptions, prefix, callback) {
      callback();
    },
    subscribeUserToList: function (email, list, callback) {
      callback();
    }
  };

  ezmlmAdapter = proxyquire('./lib/groups/ezmlmAdapter', {'ezmlm-node': function () { return ezmlmStub; }});
}

function handle(err) {
  if (err) {
    console.log(err);
    process.exit();
  }
}

groupsService.getAllAvailableGroups(function (err, groups) {
  handle(err);
  async.each(groups, function (group, callback) {
    var list = group.id;
    ezmlmAdapter.createList(list, group.emailPrefix, function (err) {
      if (err) { return callback(err); }
      console.log('ezmlm create list: "' + list + '" prefixed: "' + group.emailPrefix + '"');
      groupsService.getSympaUsersOfList(list, function (err, users) {
        var userlist = users.join(',');
        console.log('ezmlm subscribe users: "' + userlist + '" to list: "' + list + '"');
        ezmlmAdapter.addUserToList(userlist, list, callback);
      });
    });
  }, function (err) {
    handle(err);
    process.exit();
  });
});


