/*eslint no-process-exit: 0 */
/* eslint no-console: 0 */
'use strict';

require('./configure'); // initializing parameters
var beans = require('simple-configure').get('beans');
var activitystore = beans.get('activitystore');

var really = process.argv[2];
if (!really || really !== 'really') {
  console.log('If you want to run this script, append "really" to the command line.');
  process.exit();
}

activitystore.allActivities((err, activities) => {
  if (err) {
    console.log(err);
    process.exit();
  }
  var simple = activities.filter(activity => activity.resourceNames().length === 1);
  var more = activities.filter(activity => activity.resourceNames().length > 1);

  more.forEach(activity => console.log(activity.title() + ' (url: ' + activity.url() + ')'));
  console.log(more.length + ' activites with multiple resources');
  console.log(simple.length + ' activites with onle one resource');
  console.log(activities.length + ' activites total');

  process.exit();

});
