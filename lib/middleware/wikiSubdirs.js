"use strict";

var Git = require('nconf').get('beans').get('gitmech')();

module.exports = function subdirs(req, res, next) {
  Git.lsdirs(function (err, subdirs) {
    if (err) {return next(err); }
    res.locals.wikisubdirs = subdirs;
    next();
  });
};
