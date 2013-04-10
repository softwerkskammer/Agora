"use strict";

module.exports = function (connectionName, conf) {
  var conn = connectionName,
    Db = require('mongodb').Db,
    Server = require('mongodb').Server;

  var host = conf.get('mongoHost'),
    port = parseInt(conf.get('mongoPort'), 10),
    user = conf.get('mongoUser'),
    pass = conf.get('mongoPass');

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

    getById: function (id, callback) {
      this.getByField({id: id}, callback);
    },

    getByField: function (fieldAsObject, callback) {
      performInDB(function (err, db) {
        if (err) {
          return callback(err);
        }
        db.collection(conn).find(fieldAsObject).toArray(function (error, result) {
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
        collection.remove({id: object.id}, {safe: true}, function (err) {
          if (err) {
            console.log('error on removal of object: ', object.id);
            db.close();
            return callback(err);
          }
          collection.insert(object, {safe: true}, function (error, result) {
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