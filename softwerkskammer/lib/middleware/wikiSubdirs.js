'use strict';

const R = require('ramda');
const async = require('async');
const beans = require('simple-configure').get('beans');
const Git = beans.get('gitmech');
const Group = beans.get('group');
const groupstore = beans.get('groupstore');

module.exports = function subdirs(req, res, next) {
  async.parallel(
    {
      gitdirs: Git.lsdirs,
      groups: groupstore.allGroups
    },
    (err, results) => {
      if (err) { return next(err); }
      const gitdirs = results.gitdirs;
      const regionals = R.intersection(Group.regionalsFrom(results.groups).map(group => group.id), gitdirs);
      const thematics = R.intersection(Group.thematicsFrom(results.groups).map(group => group.id), gitdirs);
      const additionalWikis = R.difference(gitdirs, results.groups.map(group => group.id));
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
