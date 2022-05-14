/* eslint no-process-exit: 0 */
/* eslint no-console: 0 */

require("../../configure"); // initializing parameters

const async = require("async");
const beans = require("simple-configure").get("beans");
const store = beans.get("memberstore");
const persistence = beans.get("membersPersistence");

const service = beans.get("membersService");

async function run() {
  const members = await store.allMembers();
  if (!members) {
    console.log("avatar updater had problems loading members"); // for cron mail
    process.exit(1);
  }
  async.each(members, service.updateImage, async (err2) => {
    if (err2) {
      console.log("avatar updater encountered an error: " + err2.message); // for cron mail
    }
    await persistence.closeDBAsync();
    process.exit();
  });
}

run();
