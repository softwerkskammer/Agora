"use strict";
const R = require("ramda");
const Git = require("../wiki/gitmech");
const Group = require("../groups/group");
const groupstore = require("../groups/groupstore");

module.exports = async function subdirs(req, res, next) {
  const [gitdirs, groups] = await Promise.all([Git.lsdirs(), groupstore.allGroups()]);
  const regional = R.intersection(
    Group.regionalsFrom(groups).map((group) => group.id),
    gitdirs,
  );
  const themed = R.intersection(
    Group.thematicsFrom(groups).map((group) => group.id),
    gitdirs,
  );
  const other = R.difference(
    gitdirs,
    groups.map((group) => group.id),
  );
  res.locals.wikisubdirs = gitdirs;
  res.locals.structuredWikisubdirs = {
    regional,
    themed,
    other,
  };
  next();
};
