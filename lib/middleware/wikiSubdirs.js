"use strict";

var Git = require('nconf').get('beans').get('gitmech')();
var _ = require('underscore');

module.exports = function subdirs(req, res, next) {
  Git.lsdirs(function (err, subdirs) {
    if (err) {return next(err); }
    res.locals.wikisubdirs = _.reject(subdirs, function (each) { return each === 'global'; });
    next();
  });
};
