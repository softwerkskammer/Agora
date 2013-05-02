"use strict";
var conf = require('nconf');

module.exports = function (connectionName) {
  var conn = connectionName;
  var Db = require('mongodb').Db;
  var Server = require('mongodb').Server;

  function newDB() {
    var host = conf.get('mongoHost');
    var port = parseInt(conf.get('mongoPort'), 10);
    return new Db('swk', new Server(host, port), {safe: false});
  }

  function performInDB(callback) {
    var user = conf.get('mongoUser');
    var pass = conf.get('mongoPass');

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
      performInDB(function (err, db) {
        if (err) {
          return callback(err);
        }
        db.collection(conn).find(searchObject).sort(sortOrder).toArray(function (error, result) {
          db.close();
          if (error) {
            return callback(error);
          }
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
