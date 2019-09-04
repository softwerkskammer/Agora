/* eslint no-process-exit: 0 */
/* eslint no-console: 0 */

require('../../configure'); // initializing parameters

const async = require('async');
const beans = require('simple-configure').get('beans');
const store = beans.get('memberstore');
const persistence = beans.get('membersPersistence');

const service = beans.get('membersService');

store.allMembers((err, members) => {
  if (err || !members) { console.log('avatar updater had problems loading members'); }
  console.log('starting avatar update');
  async.each(members, service.updateImage, err2 => {
    if (err2) {
      console.log('avatar updater encountered an error: ' + err2.message);
    }
    console.log('finishing avatar update');
    persistence.closeDB(() => {
      process.exit();
    });
  });
});
