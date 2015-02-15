'use strict';

require('./configure'); // initializing parameters
var proxyquire = require('proxyquire');
var async = require('async');
var beans = require('simple-configure').get('beans');
var sympa = beans.get('sympa');
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

sympa.getAllAvailableLists(function (err, lists) {
  handle(err);
  async.each(lists, function (list, callback) {
    ezmlmAdapter.createList(list, list, function (err) {
      if (err) { return callback(err); }
      console.log('ezmlm create list: "' + list + '"');
      sympa.getUsersOfList(list, function (err, users) {
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


