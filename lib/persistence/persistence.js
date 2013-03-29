"use strict";

module.exports = function (location) {
  var dir = location,
    Db = require('mongodb').Db,
    Server = require('mongodb').Server;

  return {
    list: function (callback) {
      var db = new Db(dir, new Server('127.0.0.1', 27017), {safe: false});
      db.open(function (err, db) {
        var collection = db.collection(dir);
        collection.find().toArray(function (error, result) {
          db.close();
          if (error) {
            return callback(error);
          }
          result.sort(function (a, b) {
            return a.id.localeCompare(b.id);
          });
          callback(null, result);
        });
      });
    },

    getById: function getById(id, callback) {
      var db = new Db(dir, new Server('127.0.0.1', 27017), {safe: false});
      db.open(function (err, db) {
        var collection = db.collection(dir);
        collection.find({id: id}).toArray(function (error, result) {
          db.close();
          if (error) {
            return callback(error);
          }
          callback(null, result[0]);
        });
      });
    },

    save: function (object, callback) {
      var db = new Db(dir, new Server('127.0.0.1', 27017), {safe: false});
      db.open(function (err, db) {
        var collection = db.collection(dir);
        collection.remove({id: object.id}, function (err) {
          if (err) {
            db.close();
            return callback(err);
          }
          collection.insert(object, {w: 1}, function (error, result) {
            db.close();
            if (error) {
              return callback(error);
            }
            callback(null, result);
          });
        });
      });
    },

    drop: function (callback) {
      var db = new Db(dir, new Server('127.0.0.1', 27017), {safe: false});
      db.open(function (err, db) {
        db.dropCollection(dir, function (err, result) {
          db.close();
          callback(err, result);
        });
      });
    }
  };
};