/* eslint no-underscore-dangle: 0 */
'use strict';

var async = require('async');
var conf = require('simple-configure');
var beans = conf.get('beans');
var _ = require('lodash');
var persistence = beans.get('membersPersistence');
var subscriberPersistence = beans.get('subscribersPersistence');
var Member = beans.get('member');
var misc = beans.get('misc');
var naturalCmp = require('underscore.string/naturalCmp');
var logger = require('winston').loggers.get('transactions');
var toMember = _.partial(misc.toObject, Member);

var sortCaseInsensitive = function (objectlist) {
  return objectlist.sort(function (a, b) {
    return naturalCmp(a.lastname.toLowerCase() + ' ' + a.firstname.toLowerCase(), b.lastname.toLowerCase() + ' ' + b.firstname.toLowerCase());
  });

};

var toMemberList = function (callback, err, result) {
  if (err) { return callback(err); }
  callback(null, _.map(sortCaseInsensitive(result), function (each) { return new Member(each); }));
};

module.exports = {
  allMembers: function (callback) {
    persistence.listByField({'socratesOnly': false}, {lastname: 1, firstname: 1}, _.partial(toMemberList, callback));
  },

  socratesOnlyMembers: function (callback) {
    persistence.listByField({'socratesOnly': true}, {lastname: 1, firstname: 1}, _.partial(toMemberList, callback));
  },

  superUsers: function (callback) {
    var superusersids = conf.get('superuser');
    persistence.listByField({'id': misc.arrayToLowerCaseRegExp(superusersids)}, {
      lastname: 1,
      firstname: 1
    }, _.partial(toMemberList, callback));
  },

  getMembersForEMails: function (emails, callback) {
    if (emails.length === 0) { return callback(null, []); }
    async.map(_.chunk(emails, 500),
      function (chunk, callbackOfChunk) {
        persistence.listByField({email: misc.arrayToLowerCaseRegExp(chunk)}, {}, _.partial(toMemberList, callbackOfChunk));
      },
      function (err, members) {
        callback(err, _.flatten(members));
      }
    );
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

  getMembersWithInterest: function (interest, options, callback) {
    persistence.listByField(
      {interests: {$regex: '(^|\\s*,\\s*)' + misc.regexEscape(interest.trim()) + '($|\\s*,\\s*)', $options: options}},
      {},
      _.partial(toMemberList, callback)
    );
  },

  saveMember: function (member, callback) {
    persistence.save(member.state, callback);
  },

  removeMember: function (member, callback) {
    persistence.remove(member.id(), function (err) {
      logger.info('Member removed:' + JSON.stringify(member));
      callback(err);
    });
  },

  isSoCraTesSubscriber: function (id, callback) {
    subscriberPersistence.getById(id, function (err, subscriber) {
      callback(err, !!subscriber);
    });
  }
};


