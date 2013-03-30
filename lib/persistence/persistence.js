"use strict";

module.exports = function (connectionName) {
  var conn = connectionName,
    Db = require('mongodb').Db,
    Server = require('mongodb').Server;

  var host = process.env.MONGO_HOST || '127.0.0.1',
    port = parseInt(process.env.MONGO_PORT, 10) || 27017,
    user = process.env.MONGO_USER || null,
    pass = process.env.MONGO_PASS || null;


  function newDB() {
    return new Db('swk', new Server(host, port), {safe: false});
  }

  function performInDB(callback) {
    newDB().open(function (err, db) {
      if (user) {
        db.authenticate(user, pass, function (e) {
          if (e) {
            return callback(e);
          }
          callback(err, db);
        });
      } else {
        callback(err, db);
      }
    });
  }

  return {
    list: function (callback) {
      performInDB(function (err, db) {
        if (err) {
          return callback(err);
        }
        db.collection(conn).find().toArray(function (error, result) {
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
      performInDB(function (err, db) {
        if (err) {
          return callback(err);
        }
        db.collection(conn).find({id: id}).toArray(function (error, result) {
          db.close();
          if (error) {
            return callback(error);
          }
          callback(null, result[0]);
        });
      });
    },

    save: function (object, callback) {
      performInDB(function (err, db) {
        if (err) {
          return callback(err);
        }
        var collection = db.collection(conn);
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
      performInDB(function (err, db) {
        if (err) {
          return callback(err);
        }
        db.dropCollection(conn, function (err, result) {
          db.close();
          callback(err, result);
        });
      });
    }
  };
};