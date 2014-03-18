'use strict';

require('./configure'); // initializing parameters
var beans = require('nconf').get('beans');
var membersPersistence = beans.get('membersPersistence');
var groupsPersistence = beans.get('groupsPersistence');
var sympaPersistence = beans.get('sympaPersistence');
var Group = beans.get('group');
var Member = beans.get('member');

var async = require('async');

var really = process.argv[2];

if (!really || really !== 'really') {
  console.log('If you really want to init the db, append "really" to the command line.');
  process.exit();
}

function logResult(err, message) {
  if (err) { return console.log('An error occurred: ' + err); }
  console.log(message);
}

async.parallel(
  [
    function createLists(callback) {
      var lists = [
        {id: 'alle'},
        {id: 'commercial'},
        {id: 'neueplattform'},
        {id: 'craftsmanswap'},
        {id: 'internet'}
      ];
      async.map(lists, function (list, callback) {
        sympaPersistence.save({"id" : list.id, "users": []}, function (err) {
          callback(err, 'List "' + list.id + '"');
        });
      }, function (err, results) {
        callback(err, results.join(', '));
      });
    },
    function createGroups(callback) {
      var groups = [
        {id: 'alle', emailPrefix: 'alleAlle', description: 'D-Scription', shortName: 'Alle', longName: 'Alle', type: 'Themengruppe', color: '#ff0000', mapX: '100', mapY: '100'},
        {id: 'commercial', emailPrefix: 'commercial', description: 'D-Scription', longName: 'Commercial', type: 'Regionalgruppe', color: '#ff00ff', mapX: '200', mapY: '100', shortName: 'C'},
        {id: 'neueplattform', emailPrefix: 'neueplattform', description: 'D-Scription', longName: 'Agora', type: 'Regionalgruppe', color: '#ffff00', mapX: '180', mapY: '100', shortName: 'A'},
        {id: 'craftsmanswap', emailPrefix: 'craftsmanswap', description: 'D-Scription', longName: 'Craftsman Swaps', type: 'Regionalgruppe', color: '#0000ff', mapX: '100', mapY: '200', shortName: 'CS'},
        {id: 'internet', emailPrefix: 'internet', description: 'D-Scription', longName: 'Virtual Group', type: 'Regionalgruppe', color: '#00ff00', mapX: '100', mapY: '300', shortName: 'VG'}
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
          membersPersistence.save(new Member(member).state, function (err) {
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
    process.exit();
  }

);

