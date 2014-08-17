'use strict';

var _ = require('lodash');
var async = require('async');
var beans = require('nconf').get('beans');
var Git = beans.get('gitmech');
var Group = beans.get('group');
var groupstore = require('nconf').get('beans').get('groupstore');

module.exports = function subdirs(req, res, next) {
  async.parallel(
    {
      gitdirs: Git.lsdirs,
      groups: groupstore.allGroups
    },
    function (err, results) {
      var gitdirs = results.gitdirs;
      var regionals = _(Group.regionalsFrom(results.groups)).pluck('id').intersection(gitdirs).value();
      var thematics = _(Group.thematicsFrom(results.groups)).pluck('id').intersection(gitdirs).value();
      var additionalWikis = _.difference(gitdirs, _.pluck(results.groups, 'id'));
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
