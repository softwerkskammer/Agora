/* eslint no-process-exit: 0 */
/* eslint no-console: 0 */

require("../../configure"); // initializing parameters

const beans = require("simple-configure").get("beans");
const store = beans.get("memberstore");
const persistence = beans.get("membersPersistence");

const service = beans.get("membersService");

async function run() {
  try {
    const members = await store.allMembers();
    if (!members) {
      console.log("avatar updater had problems loading members"); // for cron mail
      process.exit(1);
    }
    await Promise.all(members.map(service.updateImage));
    await persistence.closeDBAsync();
    process.exit();
  } catch (e) {
    console.log("avatar updater encountered an error: " + e.message); // for cron mail
    process.exit(1);
  }
}

run();
