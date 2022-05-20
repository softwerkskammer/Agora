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

  dataForDashboard: async function dataForDashboard(nickname, callback) {
    const member = await groupsAndMembersService.getMemberWithHisGroups(nickname);
    if (!member) {
      return callback(new Error("no member found"));
    }
    const activities = await activitiesService.getUpcomingActivitiesOfMemberAndHisGroups(member);
    const basicHeight = 3;
    const basicHeightPerSection = 1;
    const postsByGroup = {};
    const changesByGroup = {};
    const linesPerGroup = {};

    const functions = (member.subscribedGroups || []).map((group) => {
      return new Promise((resolve, reject) => {
        const groupid = group.id;
        linesPerGroup[groupid] = basicHeight;
        wikiService.getBlogpostsForGroup(groupid, (err2, blogposts) => {
          if (err2) {
            return reject(err2);
          }
          postsByGroup[groupid] = blogposts;
          linesPerGroup[groupid] = linesPerGroup[groupid] + basicHeightPerSection + blogposts.length;
          wikiService.listChangedFilesinDirectory(groupid, (err3, metadatas) => {
            if (err3) {
              return reject(err3);
            }
            changesByGroup[groupid] = metadatas;
            linesPerGroup[groupid] = linesPerGroup[groupid] + basicHeightPerSection + metadatas.length;
            return resolve();
          });
        });
      });
    });
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
