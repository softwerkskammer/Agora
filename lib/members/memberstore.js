'use strict';

var beans = require('nconf').get('beans');
var _ = require('lodash');
var persistence = beans.get('membersPersistence');
var Member = beans.get('member');
var misc = beans.get('misc');
var _s = require('underscore.string');

var toMember = _.partial(misc.toObject, Member);

var sortCaseInsensitive = function (objectlist) {
  return objectlist.sort(function (a, b) {
    return _s.naturalCmp(a.lastname + ' ' + a.firstname, b.lastname + ' ' + b.firstname);
  });

};

var toMemberList = function (callback, err, result) {
  if (err) { return callback(err); }
  callback(null, _.map(sortCaseInsensitive(result), function (each) { return new Member(each); }));
};

module.exports = {
  allMembers: function (callback) {
    persistence.list({lastname: 1, firstname: 1}, _.partial(toMemberList, callback));
  },

  getMembersForEMails: function (emails, callback) {
    if (emails.length === 0) { return callback(null, []); }
    persistence.listByField({email: misc.arrayToLowerCaseRegExp(emails)}, {}, _.partial(toMemberList, callback));
  },

  getMember: function (nickname, callback) {
    persistence.getByField({nickname: misc.toLowerCaseRegExp(nickname.trim())}, _.partial(toMember, callback));
  },

  getMemberForId: function (id, callback) {
    persistence.getById(id, _.partial(toMember, callback));
  },

  getMemberForAuthentication: function (authenticationId, callback) {
    persistence.getByField({authentications: authenticationId}, _.partial(toMember, callback));
  },

  getMembersForIds: function (ids, callback) {
    persistence.listByIds(ids, {}, _.partial(toMemberList, callback));
  },

  getMemberForEMail: function (email, callback) {
    persistence.getByField({email: misc.toLowerCaseRegExp(email)}, _.partial(toMember, callback));
  },

  saveMember: function (member, callback) {
    persistence.save(member.state, callback);
  }
};


