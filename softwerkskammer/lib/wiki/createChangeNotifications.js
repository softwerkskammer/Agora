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

async function closeAndExit() {
  await persistence.closeMongo();
  /* eslint no-process-exit: 0 */
  logger.info("Terminating the process.......");
  process.exit();
}

logger.info("== Wiki Changes ==========================================================================");
persistence.getByField({ id: lastNotifications }, async (err, result) => {
  if (err) {
    logger.error("Error when reading lastWikiNotifications: " + err);
    return await closeAndExit();
  }
  logger.info("No error when reading lastWikiNotifications");
  const yesterday = new Date(Date.now() - 86400000); // minus 1 day
  const lastNotified = result || { id: lastNotifications, moment: yesterday }; // moment here is a Date
  if (result) {
    logger.info("Last notified: " + util.inspect(result.moment));
  }
  try {
    const changes = await wikiService.findPagesForDigestSince(lastNotified.moment.getTime());
    if (changes.length === 0) {
      logger.info("no changes to report");
      return await closeAndExit();
    }
    await notifications.wikiChanges(changes);
    lastNotified.moment = new Date();
    await persistence.saveMongo(lastNotified);
    logger.info("Wiki-Changes notified at: " + lastNotified.moment);
    return await closeAndExit();
  } catch (e) {
    logger.error("Error when finding pages for Digest: " + e);
    console.log("Error when finding pages for Digest: " + e); // for cron mail
    return await closeAndExit();
  }
});
