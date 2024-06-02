/* eslint-disable no-console, no-process-exit */
require("../../configure.js");

const conf = require("simple-configure");
const persistenceLite = require("../persistence/sqlitePersistence.js");
const MongoClient = require("mongodb").MongoClient;

const url = conf.get("mongoURL");

async function loadAll() {
  const client = await MongoClient.connect(url);
  const db = client.db();
  const collections = await db.collections();
  const finders = collections
    .filter(
      (col) =>
        !["announcementstore", "colorstore", "sessions", "teststore", "waitinglistStore"].includes(col.collectionName),
    )
    .map(async (coll) => {
      return {
        name: coll.collectionName,
        res: await db.collection(coll.collectionName).find().toArray(),
      };
    });
  const result = await Promise.all(finders);
  client.close();
  return result;
}

async function migrateFromMongo() {
  if (persistenceLite("memberstore").list().length > 0) {
    console.log("DB already migrated");
    process.exit(0);
  }
  const collections = await loadAll();
  try {
    collections.forEach((part) => {
      const rowsBefore = part.res.length;
      console.log(`Migrating: ${part.name} with ${rowsBefore} rows.`);
      const rows = part.res.map((row) => {
        delete row._id; // eslint-disable-line no-underscore-dangle
        return JSON.parse(JSON.stringify(row));
      });
      const table =
        part.name === "activitystore"
          ? persistenceLite(part.name, "startDate,endDate,url,version")
          : persistenceLite(part.name);
      table.saveAll(rows);
      const rowsAfter = table.list().length;
      console.log(`Migrated: ${part.name} to SQL with ${rowsAfter} rows.`);
      if (rowsBefore === rowsAfter) {
        console.log(`SUCCESSFUL for ${part.name}`);
      }
    });
    process.exit(0);
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
    process.exit(1);
  }
}

migrateFromMongo();
