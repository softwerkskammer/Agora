/*eslint no-process-exit: 0 */
/* eslint no-console: 0 */
'use strict';

require('./configure'); // initializing parameters
const proxyquire = require('proxyquire');
const conf = require('simple-configure');
const beans = conf.get('beans');
const groupsService = beans.get('groupsService');
const async = require('async');
let ezmlm;

const homeDir = conf.get('fullyQualifiedHomeDir') || '/fq/homeDir';

let really = process.argv[2];
const doSave = process.argv[3] === 'doSave';

if (!really || really !== 'really') {
  console.log('If you really want to migrate the lists, append "really" to the command line.');
  console.log('If you really want to save, append "doSave" after "really" to the command line.');
  process.exit();
}

if (doSave) {
  ezmlm = require('ezmlm-node')(homeDir, conf.get('emaildomainname'), conf.get('listownerAddress'), conf.get('ezmlmrc'));
} else {
  const perform = (dodo, callback) => {
    console.log(dodo);
    callback();
  };
  ezmlm = proxyquire('ezmlm-node', {'./ezmlmExec': {perform}})(homeDir);
}

function handle(err) {
  if (err) {
    console.log(err);
    process.exit();
  }
}

groupsService.getAllAvailableGroups((err, groups) => {
  handle(err);
  async.each(groups, (group, callback) => {
    const id = group.id;
    if (id === 'alle') { return callback(); }
    console.log('\n=========== Changing list: ' + id);
    ezmlm.replyToList(id, callback);
  }, err1 => {
    handle(err1);
    process.exit();
  });
});


