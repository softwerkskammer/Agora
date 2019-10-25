/*eslint no-process-exit: 0 */
/* eslint no-console: 0 */
'use strict';

const async = require('async');

require('./configure'); // initializing parameters
const beans = require('simple-configure').get('beans');
const groupstore = beans.get('groupstore');

const MAP_COORDINATES_NORTH = 55.05864;
const MAP_COORDINATES_EAST = 17.160749;
const MAP_COORDINATES_SOUTH = 45.817920;
const MAP_COORDINATES_WEST = 5.866944;
const MAP_COORDINATES_WIDTH = MAP_COORDINATES_EAST - MAP_COORDINATES_WEST;
const MAP_COORDINATES_HEIGHT = MAP_COORDINATES_NORTH - MAP_COORDINATES_SOUTH;

const really = process.argv[2];
if (!really || really !== 'really') {
  console.log('If you want to run this script, append "really" to the command line.');
  process.exit();
}

groupstore.allGroups((err, groups) => {
  if (err) {
    console.log(err);
    process.exit();
  }

  function updateGroup(g) {
    if (g.mapX) {
      const oldX = parseFloat(g.mapX);
      const oldY = parseFloat(g.mapY);
      g.mapX = MAP_COORDINATES_WEST + oldX / 342 * MAP_COORDINATES_WIDTH;
      g.mapY = MAP_COORDINATES_SOUTH + (1 - (oldY / 441)) * MAP_COORDINATES_HEIGHT;

      console.log(g.id + ' alt X: ' + oldX + ' Y: ' + oldY + ' -- neu X: ' + g.mapX + ' Y: ' + g.mapY);
    }
  }

  async.each(groups, (group, callback) => {
    updateGroup(group);
    groupstore.saveGroup(group, (err2, res) => {
      console.log(res);
      callback(err2, res);
    });
  }, err1 => {
    if (err1) {
      console.log('Error on save');
      console.log(err1);
      process.exit();
    }
    console.log('All groups processed');
    process.exit();
  });

});

