const conf = require("simple-configure");
const async = require("async");
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

  function performInDB(callback) {
    if (ourDBConnectionState === DBSTATE.OPEN) {
      logInfo("connection is open");
      return callback(null, ourDB);
    }
    logInfo("connection is " + ourDBConnectionState + ", opening it and retrying");
    setTimeout(function () {
      performInDB(callback);
    }, 100);
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

  persistence = {
    list: function list(sortOrder, callback) {
      this.listByField({}, sortOrder, callback);
    },

    listByIds: function listByIds(list, sortOrder, callback) {
      this.listByField({ id: { $in: list } }, sortOrder, callback);
    },

    listByField: function listByField(searchObject, sortOrder, callback) {
      this.listByFieldWithOptions(searchObject, {}, sortOrder, callback);
    },

    listByFieldWithOptions: function listByFieldWithOptions(searchObject, options, sortOrder, callback) {
      performInDB((err, db) => {
        if (err) {
          return callback(err);
        }
        const cursor = db.collection(collectionName).find(searchObject, options).sort(sortOrder);
        return cursor
          .toArray()
          .then((res) => callback(null, res))
          .catch((err1) => callback(err1));
      });
    },

    listAsync: async function listAsync(sortOrder) {
      return this.listByFieldAsync({}, sortOrder);
    },

    listByIdsAsync: async function listByIdsAsync(list, sortOrder) {
      return this.listByFieldAsync({ id: { $in: list } }, sortOrder);
    },

    listByFieldAsync: async function listByFieldAsync(searchObject, sortOrder) {
      return this.listByFieldWithOptionsAsync(searchObject, {}, sortOrder);
    },

    listByFieldWithOptionsAsync: async function listByFieldWithOptionsAsync(searchObject, options, sortOrder) {
      const db = await getOpenDb();
      return db.collection(collectionName).find(searchObject, options).sort(sortOrder).toArray();
    },

    getById: function getById(id, callback) {
      this.getByField({ id }, callback);
    },

    getByField: function getByField(fieldAsObject, callback) {
      performInDB((err, db) => {
        if (err) {
          return callback(err);
        }
        db.collection(collectionName)
          .find(fieldAsObject)
          .toArray((err1, result) => {
            if (err1) {
              return callback(err1);
            }
            callback(err1, result[0]);
          });
      });
    },

    getByIdAsync: async function getByIdAsync(id) {
      return this.getByFieldAsync({ id });
    },

    getByFieldAsync: async function getByFieldAsync(fieldAsObject) {
      const db = await getOpenDb();
      const result = await db.collection(collectionName).find(fieldAsObject).toArray();
      return result[0];
    },

    mapReduce: function mapReduce(map, reduce, options, callback) {
      performInDB((err, db) => {
        if (err) {
          return callback(err);
        }
        db.listCollections({ name: collectionName }).toArray((err1, names) => {
          if (err1) {
            callback(err1);
          }
          if (names.length === 0) {
            callback(null, []);
          } else {
            db.collection(collectionName).mapReduce(map, reduce, options, callback);
          }
        });
      });
    },

    mapReduceAsync: async function mapReduceAsync(map, reduce, options) {
      const db = await getOpenDb();
      const names = await db.listCollections({ name: collectionName }).toArray();
      if (names.length === 0) {
        return [];
      } else {
        return db.collection(collectionName).mapReduce(map, reduce, options);
      }
    },

    save: function save(object, callback) {
      this.update(object, object.id, callback);
    },

    update: function update(object, storedId, callback) {
      if (object.id === null || object.id === undefined) {
        return callback(new Error("Given object has no valid id"));
      }
      performInDB((err, db) => {
        if (err) {
          return callback(err);
        }
        const collection = db.collection(collectionName);
        collection.replaceOne({ id: storedId }, object, { upsert: true }, (err1) => {
          if (err1) {
            return callback(err1);
          }
          //logger.info(object.constructor.name + ' saved: ' + JSON.stringify(object));
          callback(null);
        });
      });
    },

    remove: function remove(objectId, callback) {
      if (objectId === null || objectId === undefined) {
        return callback(new Error("Given object has no valid id"));
      }
      performInDB((err, db) => {
        if (err) {
          return callback(err);
        }
        const collection = db.collection(collectionName);
        collection.deleteOne(
          { id: objectId },
          {
            writeConcern: { w: 1 },
          },
          (err1) => {
            callback(err1);
          }
        );
      });
    },

    saveAsync: async function saveAsync(object) {
      return this.updateAsync(object, object.id);
    },

    updateAsync: async function updateAsync(object, storedId) {
      if (object.id === null || object.id === undefined) {
        throw new Error("Given object has no valid id");
      }
      const db = await getOpenDb();
      const collection = db.collection(collectionName);
      return collection.replaceOne({ id: storedId }, object, { upsert: true });
    },

    removeAsync: async function removeAsync(objectId) {
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

    saveWithVersion: function saveWithVersion(object, callback) {
      const self = this;
      if (object.id === null || object.id === undefined) {
        return callback(new Error("Given object has no valid id"));
      }
      performInDB((err, db) => {
        if (err) {
          return callback(err);
        }
        const collection = db.collection(collectionName);
        const oldVersion = object.version;
        object.version = oldVersion ? oldVersion + 1 : 1;
        self.getById(object.id, (err1, result) => {
          if (err1) {
            return callback(err1);
          }
          if (result) {
            // object exists
            collection.findOneAndUpdate(
              { id: object.id, version: oldVersion },
              { $set: object },
              { new: true, upsert: false },
              (err2, newObject) => {
                if (err2) {
                  return callback(err2);
                }
                if (!newObject.value) {
                  // something went wrong: restore old version count
                  object.version = oldVersion;
                  return callback(new Error(CONFLICTING_VERSIONS));
                }
                //logger.info(object.constructor.name + ' found and modified: ' + JSON.stringify(object));
                callback(null, newObject.value);
              }
            );
          } else {
            // object is not yet persisted
            self.save(object, callback);
          }
        });
      });
    },

    saveWithVersionAsync: async function saveWithVersionAsync(object) {
      const self = this;
      if (object.id === null || object.id === undefined) {
        throw new Error("Given object has no valid id");
      }
      const db = await getOpenDb();
      const collection = db.collection(collectionName);
      const oldVersion = object.version;
      object.version = oldVersion ? oldVersion + 1 : 1;
      const result = await this.getByIdAsync(object.id);
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
        return self.saveAsync(object);
      }
    },

    saveAll: function saveAll(objects, outerCallback) {
      const self = this;
      async.each(
        objects,
        (each, callback) => {
          self.save(each, callback);
        },
        outerCallback
      );
    },

    drop: function drop(callback) {
      performInDB((err, db) => {
        if (err) {
          return callback(err);
        }
        logger.info("Drop " + collectionName + " called!");
        db.dropCollection(collectionName, (err1) => {
          callback(err1);
        });
      });
    },

    saveAllAsync: async function saveAllAsync(objects) {
      return Promise.all(objects.map((obj) => this.saveAsync(obj)));
    },

    dropAsync: async function dropAsync() {
      const db = await getOpenDb();
      logger.info("Drop " + collectionName + " called!");
      return db.dropCollection(collectionName);
    },

    openDBAsync: async function openDBAsync() {
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

  persistence.openDBAsync();
  return persistence;
};
