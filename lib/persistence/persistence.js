"use strict";
var conf = require('nconf');
var async = require('async');
var ourDB;

module.exports = function (connectionName) {
  var conn = connectionName;

  function performInDB(callback) {
    if (ourDB) {
      callback(null, ourDB);
    }
    else {
      persistence.connect();
      setTimeout(function () {performInDB(callback); }, 500);
    }
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
      performInDB(function (err, db) {
        if (err) {
          return callback(err);
        }
        db.collection(conn).find(searchObject).sort(sortOrder).toArray(function (error, result) {
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
            return callback(err);
          }
          collection.insert(object, {safe: true}, function (error, result) {
            if (error) {
              return callback(error);
            }
            callback(null, result);
          });
        });
      });
    },

    saveAll: function (objects, outerCallback) {
      var self = this;
      async.map(objects, function (each, callback) {
        callback(null, function asSaveFunction(callback) {
          self.save(each, callback);
        });
      }, function (err, saveFunctions) {
        async.parallel(saveFunctions, function (err, results) {
          outerCallback(err, results);
        });
      });
    },

    drop: function (callback) {
      performInDB(function (err, db) {
        if (err) {
          return callback(err);
        }
        db.dropCollection(conn, function (err, result) {
          callback(err, result);
        });
      });
    },

    connect: function () {
      if (ourDB !== undefined) {
        return;
      }

      ourDB = null;
      var Db = require('mongodb').Db;
      var Server = require('mongodb').Server;

      var host = conf.get('mongoHost');
      var port = parseInt(conf.get('mongoPort'), 10);
      var user = conf.get('mongoUser');
      var pass = conf.get('mongoPass');

      var theDB = new Db('swk', new Server(host, port), {w: 1, safe: false});
      theDB.open(function (err, db) {
        if (err) { console.log(err); }
        if (user) {
          db.authenticate(user, pass, function (e) {
            if (e) { console.log(e); } else { return ourDB = db; }
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
