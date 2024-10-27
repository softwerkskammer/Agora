"use strict";
const R = require("ramda");
const beans = require("simple-configure").get("beans");
const Git = beans.get("gitmech");
const Group = beans.get("group");
const groupstore = beans.get("groupstore");

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
