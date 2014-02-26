"use strict";

module.exports = function (req, res, next) {
  res.locals.removeServerpaths = function (msg) {
    // find the path that comes before node_modules or lib:
    var pathToBeRemoved = /\/[^ ]*?\/(?=(node_modules|lib)\/)/.exec(msg);
    return msg.replace(new RegExp(pathToBeRemoved[0], 'g'), '');
  };
  next();
};
