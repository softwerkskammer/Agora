"use strict";


module.exports = function (conf) {

  var store = require('./memberstore')(conf);

  return {
    getMember: function (nickname, callback) {
      store.getMember(nickname, callback);
    }

  };
};

