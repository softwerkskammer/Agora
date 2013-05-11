"use strict";
var conf = require('nconf');
var async = require('async');
var ourDB;

module.exports = function (collectionName) {
  function performInDB(callback) {
    if (ourDB && typeof ourDB !== "string") {
      return callback(null, ourDB);
    }
    persistence.connect();
    setTimeout(function () {performInDB(callback); }, 5);
  }

  var persistence = {
    list: function (sortOrder, callback) {
      this.listByField({}, sortOrder, callback);
    },

    listByIds: function (list, sortOrder, callback) {
      this.listByField({ "id": { $in: list } }, sortOrder, callback);
    },

    listByEMails: function (list, sortOrder, callback) {
      this.listByField({ "email": { $in: list } }, sortOrder, callback);
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

    save: function (object, callback) {
      performInDB(function (err, db) {
        if (err) { return callback(err); }
        var collection = db.collection(collectionName);
        collection.remove({id: object.id}, {safe: true}, function (err) {
          if (err) { return callback(err); }
          collection.insert(object, {safe: true}, function (err, result) {
            if (err) { return callback(err); }
            callback(null, result);
          });
        });
      });
    },

    saveAll: function (objects, outerCallback) {
      var self = this;
      async.map(objects, function (each, callback) { self.save(each, callback); }, outerCallback);
    },

    drop: function (callback) {
      performInDB(function (err, db) {
        if (err) {
          return callback(err);
        }
        db.dropCollection(collectionName, function (err, result) {
          callback(err, result);
        });
      });
    },

    connect: function () {
      if (ourDB !== undefined) {
        return;
      }

      ourDB = "opening connection...";
      var Db = require('mongodb').Db;
      var Server = require('mongodb').Server;

      var host = conf.get('mongoHost');
      var port = parseInt(conf.get('mongoPort'), 10);
      var user = conf.get('mongoUser');
      var pass = conf.get('mongoPass');

      var theDB = new Db('swk', new Server(host, port), {w: 1, safe: false});
      theDB.open(function (err, db) {
        if (err) { return console.log(err); }
        if (user) {
          return db.authenticate(user, pass, function (err) {
            if (err) { return console.log(err); }
            ourDB = db;
          });
        }
        ourDB = db;
      });
    },

    disconnect: function () {
      if (ourDB === undefined) {
        return;
      }
      performInDB(function () {
        ourDB.close();
        ourDB = undefined;
      });
    }
  };

  persistence.connect();
  return persistence;
};
