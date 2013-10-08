'use strict';

require('./configure'); // initializing parameters
var beans = require('nconf').get('beans');
var membersPersistence = beans.get('membersPersistence');
var groupsPersistence = beans.get('groupsPersistence');
var Group = beans.get('group');
var Member = beans.get('member');

var async = require('async');

function logResult(err, message) {
  if (err) { return console.log('An error occurred: ' + err); }
  console.log(message);
}

async.parallel(
  [
    function createGroups(callback) {
      var groups = [
        {id: 'alle', longName: 'Alle', type: 'Themengruppe'},
        {id: 'commercial', longName: 'Commercial', type: 'Themengruppe'},
        {id: 'neueplattform', longName: 'Agora', type: 'Themengruppe'},
        {id: 'craftsmanswap', longName: 'Craftsman Swaps', type: 'Themengruppe'},
        {id: 'internet', longName: 'Virtual Group', type: 'Regionalgruppe'}
      ];
      async.map(groups, function (group, callback) {
        group.description = '';
        groupsPersistence.save(new Group(group), function (err) {
          callback(err, 'Group "' + group.id + '"');
        });
      }, function (err, results) {
        callback(err, results.join(', '));
      });
    },
    function createMembers(callback) {
      var members = [
        {id: 'auth01', nickname: 'Testi', firstname: 'Ich', lastname: 'Tester', email: 'test@me.de', location: 'Hier', profession: 'Testbeauftragter'},
        {id: 'auth02', nickname: 'Schumi', firstname: 'Michael', lastname: 'Schumacher', email: 'michael@schumacher.de', location: 'Hürth', profession: 'Ex-Rennfahrer'},
        {id: 'auth03', nickname: 'Balli', firstname: 'Michael', lastname: 'Ballack', email: 'michael@ballack.de', location: 'Görlitz', profession: 'Ex-Fußballer'},
        {id: 'auth04', nickname: 'Jamie', firstname: 'James', lastname: 'Hetfield', email: 'james@hetfield.com', location: 'Downey, LA', profession: 'Musiker'}
      ];
      async.map(members, function (member, callback) {
        membersPersistence.getById(member.id, function (err, existingMember) {
          if (existingMember) {return callback(null, 'Member "' + member.nickname + '" (already existing)'); }
          membersPersistence.save(new Member(member), function (err) {
            callback(err, 'Member "' + member.id + '"');
          });
        });
      }, function (err, results) {
        callback(err, results.join(', '));
      });
    }
  ],
  function (err, loggingmessages) {
    console.log('Filling the database...');
    logResult(err, loggingmessages.join('\n'));
    console.log('were created.');
    console.log('Turning all existing users into admins...');
    membersPersistence.list({}, function (err, members) {
      async.map(members, function (member, callback) {
        member.isAdmin = true;
        callback(null, member);
      }, function (err, results) {
        if (err) { return logResult(err, "AAAAHHHHHHH"); }
        membersPersistence.saveAll(results, function (innerError) {
          logResult(innerError, 'All existing users are now admins.');
          console.log('Done!');
          process.exit();
        });
      });
    });
  }

);

