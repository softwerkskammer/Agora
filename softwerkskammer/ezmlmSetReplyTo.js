/*eslint no-process-exit: 0 */
/* eslint no-console: 0 */
'use strict';

require('./configure'); // initializing parameters
var proxyquire = require('proxyquire');
var conf = require('simple-configure');
var beans = conf.get('beans');
var groupsService = beans.get('groupsService');
var async = require('async');
var ezmlm;

var homeDir = conf.get('fullyQualifiedHomeDir') || '/fq/homeDir';

var really = process.argv[2];
var doSave = process.argv[3] === 'doSave';

if (!really || really !== 'really') {
  console.log('If you really want to migrate the lists, append "really" to the command line.');
  console.log('If you really want to save, append "doSave" after "really" to the command line.');
  process.exit();
}

if (doSave) {
  ezmlm = require('ezmlm-node')(homeDir, conf.get('emaildomainname'), conf.get('listownerAddress'), conf.get('ezmlmrc'));
} else {
  var perform = function (dodo, callback) {
    console.log(dodo);
    callback();
  };
  ezmlm = proxyquire('ezmlm-node', {'./ezmlmExec': {perform: perform }})(homeDir);
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
    var id = group.id;
    if (id === 'alle') { return callback(); }
    console.log('\n=========== Changing list: ' + id);
    ezmlm.replyToList(id, callback);
  }, function (err1) {
    handle(err1);
    process.exit();
  });
});


