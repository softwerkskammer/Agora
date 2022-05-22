const conf = require("simple-configure");
let ourDB;
let ourClient;
const loggers = require("winston").loggers;
const logger = loggers.get("transactions");
const scriptLogger = loggers.get("scripts");

const CONFLICTING_VERSIONS = conf.get("beans").get("constants").CONFLICTING_VERSIONS;
const DBSTATE = { OPEN: "OPEN", CLOSED: "CLOSED", OPENING: "OPENING" };
let ourDBConnectionState = DBSTATE.CLOSED;

module.exports = function persistenceFunc(collectionName) {
  let persistence;

  function logInfo(logMessage) {
    if (collectionName === "settingsstore") {
      scriptLogger.info(logMessage);
    }
  }

  async function getOpenDb() {
    if (ourDBConnectionState === DBSTATE.OPEN) {
      logInfo("connection is open");
      return ourDB;
    }
    logInfo("connection is " + ourDBConnectionState + ", opening it and retrying");
    await persistence.openDBAsync();
    await new Promise((resolve) => setTimeout(resolve, 100));
    return getOpenDb();
  }

  async function openDBAsync() {
    if (ourDBConnectionState !== DBSTATE.CLOSED) {
      logInfo("connection state is " + ourDBConnectionState + ". Returning.");
      return;
    }

    logInfo("Setting connection state to OPENING");
    ourDBConnectionState = DBSTATE.OPENING;

    const MongoClient = require("mongodb").MongoClient;
    logInfo("Connecting to Mongo");
    try {
      logInfo("In connect callback");
      const client = await MongoClient.connect(conf.get("mongoURL"), {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      var db = client.db("swk");
      ourDB = db;
      ourClient = client;
      ourDBConnectionState = DBSTATE.OPEN;
      logInfo("DB state is now OPEN, db = " + db);
    } catch (err) {
      logInfo("An error occurred: " + err);
      ourDBConnectionState = DBSTATE.CLOSED;
      logger.error(err);
    }
  }

  async function listByFieldWithOptions(searchObject, options, sortOrder) {
    const db = await getOpenDb();
    return db.collection(collectionName).find(searchObject, options).sort(sortOrder).toArray();
  }

  persistence = {
    listMongo: async function listMongo(sortOrder) {
      return this.listMongoByField({}, sortOrder);
    },

    listMongoByIds: async function listMongoByIds(list, sortOrder) {
      return this.listMongoByField({ id: { $in: list } }, sortOrder);
    },

    listMongoByField: async function listMongoByField(searchObject, sortOrder) {
      return listByFieldWithOptions(searchObject, {}, sortOrder);
    },

    getMongoById: async function getMongoById(id) {
      return this.getMongoByField({ id });
    },

    getMongoByField: async function getMongoByField(fieldAsObject) {
      const db = await getOpenDb();
      const result = await db.collection(collectionName).find(fieldAsObject).toArray();
      return result[0];
    },

    saveMongo: async function saveMongo(object) {
      return this.updateMongo(object, object.id);
    },

    updateMongo: async function updateMongo(object, storedId) {
      if (object.id === null || object.id === undefined) {
        throw new Error("Given object has no valid id");
      }
      const db = await getOpenDb();
      const collection = db.collection(collectionName);
      return collection.replaceOne({ id: storedId }, object, { upsert: true });
    },

    removeMongo: async function removeMongo(objectId) {
      if (objectId === null || objectId === undefined) {
        throw new Error("Given object has no valid id");
      }
      const db = await getOpenDb();
      return db.collection(collectionName).deleteOne(
        { id: objectId },
        {
          writeConcern: { w: 1 },
        }
      );
    },

    saveMongoWithVersion: async function saveWithVersionAsync(object) {
      const self = this;
      if (object.id === null || object.id === undefined) {
        throw new Error("Given object has no valid id");
      }
      const db = await getOpenDb();
      const collection = db.collection(collectionName);
      const oldVersion = object.version;
      object.version = oldVersion ? oldVersion + 1 : 1;
      const result = await this.getMongoById(object.id);
      if (result) {
        // object exists
        const newObject = await collection.findOneAndUpdate(
          { id: object.id, version: oldVersion },
          { $set: object },
          { new: true, upsert: false }
        );
        if (!newObject.value) {
          // something went wrong: restore old version count
          object.version = oldVersion;
          throw new Error(CONFLICTING_VERSIONS);
        }
        //logger.info(object.constructor.name + ' found and modified: ' + JSON.stringify(object));
        return newObject.value;
      } else {
        // object is not yet persisted
        return self.saveMongo(object);
      }
    },

    dropMongoCollection: async function dropMongoCollection() {
      const db = await getOpenDb();
      const colls = await db.collections();
      const allNames = colls.map((each) => each.namespace).filter((each) => each.endsWith(collectionName));
      if (allNames.length === 0) {
        return;
      }
      logger.info("Drop " + collectionName + " called!");
      return db.dropCollection(collectionName);
    },

    closeDBAsync: async function closeDBAsync() {
      if (ourDBConnectionState === DBSTATE.CLOSED) {
        return;
      }
      await ourClient.close();
      ourClient = undefined;
      ourDB = undefined;
      ourDBConnectionState = DBSTATE.CLOSED;
      logInfo("connection closed");
    },
  };

  openDBAsync();
  return persistence;
};
