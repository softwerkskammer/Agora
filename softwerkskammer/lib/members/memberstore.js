/* eslint no-underscore-dangle: 0 */

const conf = require("simple-configure");
const beans = conf.get("beans");
const R = require("ramda");
const persistence = beans.get("membersPersistence");
const Member = beans.get("member");
const misc = beans.get("misc");
const logger = require("winston").loggers.get("transactions");

function sortCaseInsensitive(objectlist) {
  return objectlist.sort((a, b) =>
    new Intl.Collator("de").compare(
      a.lastname.toLowerCase() + " " + a.firstname.toLowerCase(),
      b.lastname.toLowerCase() + " " + b.firstname.toLowerCase()
    )
  );
}

function toMemberList(result) {
  return sortCaseInsensitive(result).map((each) => new Member(each));
}

module.exports = {
  allMembers: async function allMembers() {
    const members = await persistence.listByFieldAsync({}, { lastname: 1, firstname: 1 });
    return toMemberList(members);
  },

  superUsers: async function superUsers() {
    const superusersids = conf.get("superuser");
    const superusers = await persistence.listByFieldAsync(
      { id: misc.arrayToLowerCaseRegExp(superusersids) },
      {
        lastname: 1,
        firstname: 1,
      }
    );
    return toMemberList(superusers);
  },

  getMembersForEMails: async function getMembersForEMails(emails) {
    if (emails.length === 0) {
      return [];
    }
    async function listThem(memberChunk) {
      const members = await persistence.listByFieldAsync({ email: misc.arrayToLowerCaseRegExp(memberChunk) }, {});
      return toMemberList(members);
    }

    return R.flatten(await Promise.all(R.splitEvery(500, emails).map(listThem)));
  },

  getMember: async function getMember(nickname) {
    const member = await persistence.getByFieldAsync({ nickname: misc.toLowerCaseRegExp(nickname.trim()) });
    return member ? new Member(member) : null;
  },

  getMemberForId: async function getMemberForId(id) {
    const member = await persistence.getByIdAsync(id);
    return member ? new Member(member) : null;
  },

  getMemberForAuthentication: async function getMemberForAuthentication(authenticationId) {
    const member = await persistence.getByFieldAsync({ authentications: authenticationId });
    return member ? new Member(member) : null;
  },

  getMembersForIds: async function getMembersForIds(ids) {
    const members = await persistence.listByIdsAsync(ids, {});
    return toMemberList(members);
  },

  getMemberForEMail: async function getMemberForEMail(email) {
    const member = await persistence.getByFieldAsync({ email: misc.toLowerCaseRegExp(email) });
    return member ? new Member(member) : null;
  },

  getMembersWithInterest: async function getMembersWithInterest(interest, options) {
    const members = await persistence.listByFieldAsync(
      {
        interests: { $regex: "(^|\\s*,\\s*)" + misc.regexEscape(interest.trim()) + "($|\\s*,\\s*)", $options: options },
      },
      {}
    );
    return toMemberList(members);
  },

  saveMember: async function saveMember(member) {
    return persistence.saveAsync(member.state);
  },

  removeMember: async function removeMember(member) {
    await persistence.removeAsync(member.id());
    logger.info("Member removed:" + JSON.stringify(member));
  },
};
