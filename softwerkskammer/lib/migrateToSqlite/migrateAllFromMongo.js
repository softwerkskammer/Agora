require("../../configure.js");

const persistenceLite = require("../persistence/sqlitePersistence.js");
const MongoClient = require("mongodb").MongoClient;
const conf = require("simple-configure");

const url = conf.get("mongoURL");

async function loadAll() {
  const client = await MongoClient.connect(url);
  const db = client.db();
  const collections = await db.collections();
  const finders = collections.map(async (coll) => {
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
  if (persistenceLite("optionenstore").getById("instance").id || !url) {
    // eslint-disable-next-line no-console
    console.log("DB already migrated");
    return;
  }
  const collections = await loadAll();
  collections.forEach((part) => {
    // eslint-disable-next-line no-console
    console.log(`Migrating: ${part.name}`);
    const rows = part.res.map((row) => {
      // eslint-disable-next-line no-underscore-dangle
      delete row._id;
      return JSON.parse(JSON.stringify(row));
    });
    if (part.name === "activitystore") {
      persistenceLite(part.name, ["startDate", "endDate", "url", "version"]).saveAll(rows);
    } else if (part.name === "terminstore") {
      persistenceLite(part.name, ["startDate", "endDate"]).saveAll(rows);
    } else {
      persistenceLite(part.name).saveAll(rows);
    }
  });
}

migrateFromMongo();
