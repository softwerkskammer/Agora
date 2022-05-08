const beans = require("simple-configure").get("beans");
const async = require("async");
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

  dataForDashboard: function dataForDashboard(nickname, callback) {
    groupsAndMembersService.getMemberWithHisGroups(nickname, (err, member) => {
      if (err) {
        return callback(err);
      }
      if (!member) {
        return callback(new Error("no member found"));
      }
      activitiesService.getUpcomingActivitiesOfMemberAndHisGroups(member, (err1, activities) => {
        if (err1) {
          return callback(err1);
        }
        const basicHeight = 3;
        const basicHeightPerSection = 1;
        const postsByGroup = {};
        const changesByGroup = {};
        const linesPerGroup = {};
        async.each(
          member.subscribedGroups || [],
          (group, cb) => {
            linesPerGroup[group.id] = basicHeight;
            wikiService.getBlogpostsForGroup(group.id, (err2, blogposts) => {
              if (err2) {
                return cb(err2);
              }
              postsByGroup[group.id] = blogposts;
              linesPerGroup[group.id] = linesPerGroup[group.id] + basicHeightPerSection + blogposts.length;
              wikiService.listChangedFilesinDirectory(group.id, (err3, metadatas) => {
                if (err3) {
                  return cb(err3);
                }
                changesByGroup[group.id] = metadatas;
                linesPerGroup[group.id] = linesPerGroup[group.id] + basicHeightPerSection + metadatas.length;
                cb();
              });
            });
          },
          (err2) => {
            callback(err2, {
              member,
              activities,
              postsByGroup,
              changesByGroup,
              groupsPerColumn: groupsByColumns(member.subscribedGroups, linesPerGroup),
            });
          }
        );
      });
    });
  },
};
