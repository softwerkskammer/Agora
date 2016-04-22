'use strict';

var _ = require('lodash');
var async = require('async');
var beans = require('simple-configure').get('beans');
var Git = beans.get('gitmech');
var Group = beans.get('group');
var groupstore = beans.get('groupstore');

module.exports = function subdirs(req, res, next) {
  async.parallel(
    {
      gitdirs: Git.lsdirs,
      groups: groupstore.allGroups
    },
    function (err, results) {
      if (err) { return next(err); }
      var gitdirs = results.gitdirs;
      var regionals = _(Group.regionalsFrom(results.groups)).map('id').intersection(gitdirs).value();
      var thematics = _(Group.thematicsFrom(results.groups)).map('id').intersection(gitdirs).value();
      var additionalWikis = _.difference(gitdirs, _.map(results.groups, 'id'));
      res.locals.wikisubdirs = gitdirs;
      res.locals.structuredWikisubdirs = {
        regional: regionals,
        themed: thematics,
        other: additionalWikis
      };
      next();
    }
  );
};
