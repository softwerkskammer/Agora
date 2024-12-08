"use strict";

const Group = require("../../lib/groups/group");

module.exports = function createTestGroups() {
  return {
    GroupA: new Group({ id: "GroupA", longName: "Gruppe A", description: "Dies ist Gruppe A.", type: "Themengruppe" }),
    GroupB: new Group({
      id: "GroupB",
      longName: "Gruppe B",
      description: "Dies ist Gruppe B.",
      type: "Regionalgruppe",
    }),
    GroupC: new Group({
      id: "GroupC",
      longName: "Gruppe C",
      description: "Dies ist Gruppe C.",
      type: "Regionalgruppe",
    }),
  };
};
