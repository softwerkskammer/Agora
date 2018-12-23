/* eslint no-underscore-dangle: 0 */

const async = require('async');
const conf = require('simple-configure');
const beans = conf.get('beans');
const R = require('ramda');
const persistence = beans.get('membersPersistence');
const Member = beans.get('member');
const misc = beans.get('misc');
const logger = require('winston').loggers.get('transactions');
const toMember = R.partial(misc.toObject, [Member]);

function sortCaseInsensitive(objectlist) {
  return objectlist.sort((a, b) => new Intl.Collator('de').compare(a.lastname.toLowerCase() + ' ' + a.firstname.toLowerCase(), b.lastname.toLowerCase() + ' ' + b.firstname.toLowerCase()));
}

function toMemberList(callback, err, result) {
  if (err) { return callback(err); }
  callback(null, sortCaseInsensitive(result).map(each => new Member(each)));
}

module.exports = {
  allMembers: function allMembers(callback) {
    persistence.listByField({}, {lastname: 1, firstname: 1}, R.partial(toMemberList, [callback]));
  },

  superUsers: function superUsers(callback) {
    const superusersids = conf.get('superuser');
    persistence.listByField({'id': misc.arrayToLowerCaseRegExp(superusersids)}, {
      lastname: 1,
      firstname: 1
    }, R.partial(toMemberList, [callback]));
  },

  getMembersForEMails: function getMembersForEMails(emails, callback) {
    if (emails.length === 0) { return callback(null, []); }
    async.map(R.splitEvery(500, emails),
      (chunk, callbackOfChunk) => persistence.listByField({email: misc.arrayToLowerCaseRegExp(chunk)},
        {},
        R.partial(toMemberList, [callbackOfChunk])),
      (err, members) => callback(err, R.flatten(members))
    );
  },

  getMember: function getMember(nickname, callback) {
    persistence.getByField({nickname: misc.toLowerCaseRegExp(nickname.trim())}, R.partial(toMember, [callback]));
  },

  getMemberForId: function getMemberForId(id, callback) {
    persistence.getById(id, R.partial(toMember, [callback]));
  },

  getMemberForAuthentication: function getMemberForAuthentication(authenticationId, callback) {
    persistence.getByField({authentications: authenticationId}, R.partial(toMember, [callback]));
  },

  getMembersForIds: function getMembersForIds(ids, callback) {
    persistence.listByIds(ids, {}, R.partial(toMemberList, [callback]));
  },

  getMemberForEMail: function getMemberForEMail(email, callback) {
    persistence.getByField({email: misc.toLowerCaseRegExp(email)}, R.partial(toMember, [callback]));
  },

  getMembersWithInterest: function getMembersWithInterest(interest, options, callback) {
    persistence.listByField(
      {interests: {$regex: '(^|\\s*,\\s*)' + misc.regexEscape(interest.trim()) + '($|\\s*,\\s*)', $options: options}},
      {},
      R.partial(toMemberList, [callback])
    );
  },

  saveMember: function saveMember(member, callback) {
    persistence.save(member.state, callback);
  },

  removeMember: function removeMember(member, callback) {
    persistence.remove(member.id(), err => {
      logger.info('Member removed:' + JSON.stringify(member));
      callback(err);
    });
  }
};


