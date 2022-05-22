const beans = require("simple-configure").get("beans");
const R = require("ramda");

const wikiService = beans.get("wikiService");
const groupsAndMembersService = beans.get("groupsAndMembersService");
const activitiesService = beans.get("activitiesService");

function groupsByColumns(groups = [], linesPerGroup) {
  const result = [[], [], []];
  const heightPerCol =
    R.values(linesPerGroup).reduce(function (sum, num) {
      return sum + num;
    }, 0) / 3;
  let currentColHeight = 0;
  let currentCol = 0;
  groups.forEach(function (group) {
    result[currentCol].push(group);
    currentColHeight += linesPerGroup[group.id];
    if (currentColHeight >= heightPerCol) {
      currentCol = Math.min(currentCol + 1, 2);
      currentColHeight = 0;
    }
  });
  return result;
}

module.exports = {
  groupsByColumns,

  dataForDashboard: async function dataForDashboard(nickname) {
    const member = await groupsAndMembersService.getMemberWithHisGroups(nickname);
    if (!member) {
      throw new Error("no member found");
    }
    const activities = await activitiesService.getUpcomingActivitiesOfMemberAndHisGroups(member);
    const basicHeight = 3;
    const basicHeightPerSection = 1;
    const postsByGroup = {};
    const changesByGroup = {};
    const linesPerGroup = {};

    async function calcLinesPerGroup(group) {
      const groupid = group.id;
      linesPerGroup[groupid] = basicHeight;
      const blogposts = await wikiService.getBlogpostsForGroup(groupid);
      postsByGroup[groupid] = blogposts;
      linesPerGroup[groupid] = linesPerGroup[groupid] + basicHeightPerSection + blogposts.length;
      const metadatas = await wikiService.listChangedFilesinDirectory(groupid);
      changesByGroup[groupid] = metadatas;
      linesPerGroup[groupid] = linesPerGroup[groupid] + basicHeightPerSection + metadatas.length;
    }
    const functions = (member.subscribedGroups || []).map(calcLinesPerGroup);
    await Promise.all(functions);
    return {
      member,
      activities,
      postsByGroup,
      changesByGroup,
      groupsPerColumn: groupsByColumns(member.subscribedGroups, linesPerGroup),
    };
  },
};
