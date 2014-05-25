'use strict';
var conf = require('nconf');
var async = require('async');
var ourDB;
var logger = require('winston').loggers.get('transactions');

var CONFLICTING_VERSIONS = conf.get('beans').get('constants').CONFLICTING_VERSIONS;
var DBSTATE = { OPEN: 'OPEN', CLOSED: 'CLOSED', OPENING: 'OPENING' };
var ourDBConnectionState = DBSTATE.CLOSED;

module.exports = function (collectionName) {
  var persistence;
  function performInDB(callback) {
    if (ourDBConnectionState === DBSTATE.OPEN) {
      return callback(null, ourDB);
    }
    persistence.openDB();
    setTimeout(function () {performInDB(callback); }, 5);
  }

  persistence = {
    list: function (sortOrder, callback) {
      this.listByField({}, sortOrder, callback);
    },

    listByIds: function (list, sortOrder, callback) {
      this.listByField({ 'id': { $in: list } }, sortOrder, callback);
    },

    listByField: function (searchObject, sortOrder, callback) {
      this.listByFieldWithOptions(searchObject, {}, sortOrder, callback);
    },

    listByFieldWithOptions: function (searchObject, options, sortOrder, callback) {
      performInDB(function (err, db) {
        if (err) { return callback(err); }
        db.collection(collectionName).find(searchObject, options).sort(sortOrder).toArray(function (err, result) {
          if (err) { return callback(err); }
          callback(null, result);
        });
      });
    },

    getById: function (id, callback) {
      this.getByField({id: id}, callback);
    },

    getByField: function (fieldAsObject, callback) {
      performInDB(function (err, db) {
        if (err) { return callback(err); }
        db.collection(collectionName).find(fieldAsObject).toArray(function (err, result) {
          if (err) { return callback(err); }
          callback(null, result[0]);
        });
      });
    },

    mapReduce: function (map, reduce, options, callback) {
      performInDB(function (err, db) {
        if (err) { return callback(err); }
        db.collection(collectionName).mapReduce(map, reduce, options, callback);
      });
    },

    save: function (object, callback) {
      this.update(object, object.id, callback);
    },

    update: function (object, storedId, callback) {
      if (object.id === null || object.id === undefined) {
        return callback(new Error('Given object has no valid id'));
      }
      performInDB(function (err, db) {
        if (err) { return callback(err); }
        var collection = db.collection(collectionName);
        collection.update({id: storedId}, object, {upsert: true}, function (err) {
          if (err) { return callback(err); }
          logger.info(object.constructor.name + ' saved: ' + JSON.stringify(object));
          callback(null);
        });
      });
    },

    saveWithVersion: function (object, callback) {
      var self = this;
      if (object.id === null || object.id === undefined) {
        return callback(new Error('Given object has no valid id'));
      }
      performInDB(function (err, db) {
        if (err) { return callback(err); }
        var collection = db.collection(collectionName);
        var oldVersion = object.version;
        object.version = oldVersion ? oldVersion + 1 : 1;
        self.getById(object.id, function (err, result) {
          if (err) { return callback(err); }
          if (result) { // object exists
            collection.findAndModify({id: object.id, version: oldVersion}, [], object, {'new': true, upsert: false}, function (err, newObject) {
              if (err) { return callback(err); }
              if (!newObject) {
                // something went wrong: restore old version count
                object.version = oldVersion;
                return callback(new Error(CONFLICTING_VERSIONS));
              }
              logger.info(object.constructor.name + ' found and modified: ' + JSON.stringify(object));
              callback(null, newObject);
            });
          } else { // object is not yet persisted
            self.save(object, callback);
          }
        });
      });
    },

    saveAll: function (objects, outerCallback) {
      var self = this;
      async.each(objects, function (each, callback) { self.save(each, callback); }, outerCallback);
    },

    drop: function (callback) {
      performInDB(function (err, db) {
        if (err) { return callback(err); }
        logger.info('Drop ' + collectionName + ' called!');
        db.dropCollection(collectionName, function (err) {
          callback(err);
        });
      });
    },

    openDB: function () {
      if (ourDBConnectionState !== DBSTATE.CLOSED) {
        return;
      }

      ourDBConnectionState = DBSTATE.OPENING;
      var Db = require('mongodb').Db;
      var Server = require('mongodb').Server;

      var host = conf.get('mongoHost');
      var port = parseInt(conf.get('mongoPort'), 10);
      var user = conf.get('mongoUser');
      var pass = conf.get('mongoPass');

      var theDB = new Db('swk', new Server(host, port), {w: 1, safe: false});
      theDB.open(function (err, db) {
        if (err) { return logger.error(err); }
        if (user) {
          return db.authenticate(user, pass, function (err) {
            if (err) { return logger.error(err); }
            ourDB = db;
            ourDBConnectionState = DBSTATE.OPEN;
          });
        }
        ourDB = db;
        ourDBConnectionState = DBSTATE.OPEN;
      });
    },

    closeDB: function () {
      if (ourDBConnectionState === DBSTATE.CLOSED) {
        return;
      }
      performInDB(function () {
        ourDB.close();
        ourDB = undefined;
        ourDBConnectionState = DBSTATE.CLOSED;
      });
    }
  };

  persistence.openDB();
  return persistence;
};
