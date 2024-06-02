require("../../configure"); // initializing parameters
const path = require("path");

const winstonConfigPath = path.join(__dirname, "../../../config/winston-config.json");
require("../../initWinston")(winstonConfigPath);

const winston = require("winston");
const logger = winston.loggers.get("scripts");

const beans = require("simple-configure").get("beans");
// open persistence AFTER logger is created
const persistence = beans.get("settingsPersistence");
const wikiService = beans.get("wikiService");
const notifications = beans.get("notifications");
const util = require("util");

const lastNotifications = "lastWikiNotifications";

function closeAndExit() {
  /* eslint no-process-exit: 0 */
  logger.info("Terminating the process.......");
  process.exit();
}

logger.info("== Wiki Changes ==========================================================================");

async function run() {
  try {
    const result = persistence.getById(lastNotifications);
    logger.info("No error when reading lastWikiNotifications");
    const yesterday = new Date(Date.now() - 86400000); // minus 1 day
    const lastNotified = result || { id: lastNotifications, moment: yesterday }; // moment here is a ISO String
    if (result) {
      logger.info(`Last notified: ${util.inspect(result.moment)}`);
    }
    const changes = await wikiService.findPagesForDigestSince(new Date(lastNotified.moment).getTime());
    if (changes.length === 0) {
      logger.info("no changes to report");
      return closeAndExit();
    }
    await notifications.wikiChanges(changes);
    lastNotified.moment = new Date();
    persistence.save(lastNotified);
    logger.info(`Wiki-Changes notified at: ${lastNotified.moment}`);
    return closeAndExit();
  } catch (e) {
    logger.error(`Error when finding pages for Digest: ${e}`);
    // eslint-disable-next-line no-console
    console.log(`Error when finding pages for Digest: ${e}`); // for cron mail
    return closeAndExit();
  }
}
run();
