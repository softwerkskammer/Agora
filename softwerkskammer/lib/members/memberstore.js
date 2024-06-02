/* eslint no-underscore-dangle: 0 */

const conf = require("simple-configure");
const beans = conf.get("beans");
const persistence = beans.get("membersPersistence");
const Member = beans.get("member");
const logger = require("winston").loggers.get("transactions");

function sortCaseInsensitive(objectlist) {
  return objectlist.sort((a, b) =>
    new Intl.Collator("de").compare(
      a.lastname.toLowerCase() + " " + a.firstname.toLowerCase(),
      b.lastname.toLowerCase() + " " + b.firstname.toLowerCase(),
    ),
  );
}

function toMemberList(result) {
  return sortCaseInsensitive(result).map((each) => new Member(each));
}

module.exports = {
  allMembers: function allMembers() {
    const members = persistence.list("data->>'$.lastname' ASC, data->>'$.lastname' ASC");
    return toMemberList(members);
  },

  superUsers: function superUsers() {
    const superusersids = conf.get("superuser");
    const superusers = persistence.listByIds(superusersids);
    return toMemberList(superusers);
  },

  getMember: function getMember(nickname) {
    const member = persistence.getByWhere(`json_extract ( data, '$.nickname' ) = '${nickname}'`);
    return member ? new Member(member) : null;
  },

  getMemberForId: function getMemberForId(id) {
    const member = persistence.getById(id);
    return member ? new Member(member) : null;
  },

  getMemberForAuthentication: function getMemberForAuthentication(authenticationId) {
    // select data from memberstore where json_extract( data, '$.authentications' ) like '%"github:450708%';
    const member = persistence.getByWhere(`json_extract( data, '$.authentications' ) like '%"${authenticationId}"%'`);
    return member ? new Member(member) : null;
  },

  getMembersForIds: function getMembersForIds(ids) {
    const members = persistence.listByIds(ids);
    return toMemberList(members);
  },

  getMemberForEMail: function getMemberForEMail(email) {
    const member = persistence.getByWhere(`json_extract ( data, '$.email' ) like '${email}'`);
    return member ? new Member(member) : null;
  },

  getMembersWithInterest: function getMembersWithInterest(interest, options) {
    const members = persistence.listByWhere(`json_extract ( data, '$.interests' ) like '%${interest}%'`);
    const result = toMemberList(members);
    if (options === "i") {
      return result.filter((mem) => {
        const interests =
          options === "i" ? mem.interestsForSelect2().map((i) => i.toLowerCase()) : mem.interestsForSelect2();
        return interests.includes(options === "i" ? interest.toLowerCase() : interest);
      });
    }
    return result.filter((mem) => mem.interestsForSelect2().includes(interest));
  },

  saveMember: function saveMember(member) {
    return persistence.save(member.state);
  },

  removeMember: function removeMember(member) {
    persistence.removeById(member.id());
    logger.info("Member removed:" + JSON.stringify(member));
  },
};
