/*eslint no-process-exit: 0 */
/* eslint no-console: 0 */
'use strict';

const R = require('ramda');

require('./configure'); // initializing parameters
const beans = require('simple-configure').get('beans');
const activitystore = beans.get('activitystore');

let really = process.argv[2];
if (!really || really !== 'really') {
  console.log('If you want to run this script, append "really" to the command line.');
  process.exit();
}

activitystore.allActivities((err, activities) => {
  if (err) {
    console.log(err);
    process.exit();
  }
  const simple = activities.filter(activity => activity.resourceNames().length === 1);
  const more = activities.filter(activity => activity.resourceNames().length > 1);

  more.forEach(activity => console.log(activity.title() + ' (url: ' + activity.url() + '-' + activity.resourceNames() + ')'));
  console.log(more.length + ' activites with multiple resources');
  console.log(simple.length + ' activites with onle one resource');
  console.log(R.uniq(simple.map(each => each.resourceNames())));
  console.log(activities.length + ' activites total');

  process.exit();

});
