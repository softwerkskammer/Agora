'use strict';

var conf = require('nconf');
var beans = conf.get('beans');
var store = beans.get('memberstore');
var avatarProvider = beans.get('avatarProvider');
var fieldHelpers = beans.get('fieldHelpers');
var _ = require('lodash');

function isReserved(nickname) {
  return new RegExp('^edit$|^new$|^checknickname$|^submit$|^administration$|^[.][.]$|^[.]$|\\+', 'i').test(nickname);
}

function wordList(members, groupingFunction) {
  return _(members).map(function (member) {
    return member.interests() && member.interests().split(',').map(function (interest) {return interest.trim(); });
  })
    .flatten() // now we have all words in one collection
    .compact() // remove empty strings
    .groupBy(groupingFunction) // prepare counting by grouping
    .transform(function (result, words) {
      var mainWord = _(words).groupBy().max(function (word) { return word.length; }).uniq().value()[0]; // choose the most common form
      return result.push({text: mainWord, weight: words.length, html: {class: 'interestify'}});
    }, []); // create the final structure
}

module.exports = {
  isValidNickname: function (nickname, callback) {
    if (fieldHelpers.containsSlash(nickname) || isReserved(nickname)) { return callback(null, false); }
    store.getMember(nickname, function (err, result) {
      if (err) { return callback(err); }
      callback(null, !result);
    });
  },

  isValidEmail: function (email, callback) {
    store.getMemberForEMail(email, function (err, result) {
      if (err) { return callback(err); }
      callback(null, !result);
    });
  },

  getImage: function (member, callback) {
    var imageDataFromCache = avatarProvider.imageDataFromCache(member);
    if (imageDataFromCache) {
      member.setAvatarData(imageDataFromCache);
      return callback();
    }
    avatarProvider.imageDataFromGravatar(member, function (data) {
      member.setAvatarData(data);
      callback();
    });
  },

  toWordList: function (members) {
    return wordList(members, function (each) { return each.toUpperCase(); })
      .value(); // unwrap the array
  },

  toUngroupedWordList: function (members) {
    return wordList(members)
      .sortBy('text')
      .value();
  },

  findOrCreateMemberFor: function (user, authenticationId, profile, done) {
    return function () {
      if (!user) {
        return store.getMemberForAuthentication(authenticationId, function (err, member) {
          if (err) { return done(err); }
          if (!member) { return done(null, {authenticationId: authenticationId, profile: profile}); }
          done(null, {authenticationId: authenticationId, member: member});
        });
      }
      var memberOfSession = user.member;
      return store.getMemberForAuthentication(authenticationId, function (err, member) {
        if (err) { return done(err); }
        if (member && memberOfSession.id() !== member.id()) { return done(new Error('Unter dieser Authentifizierung existiert schon ein Mitglied.')); }
        if (member && memberOfSession.id() === member.id()) {
          return done(null, {authenticationId: authenticationId, member: member});
        }
        // no member found
        memberOfSession.addAuthentication(authenticationId);
        store.saveMember(memberOfSession, function (err) {
          if (err) { return done(err); }
          done(null, {authenticationId: authenticationId, member: memberOfSession});
        });
      });
    };
  },

  isReserved: isReserved
};

