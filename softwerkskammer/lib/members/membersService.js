'use strict';

var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var mimetypes = require('mime-types');

var beans = require('simple-configure').get('beans');
var store = beans.get('memberstore');
var avatarProvider = beans.get('avatarProvider');
var fieldHelpers = beans.get('fieldHelpers');
var galleryService = beans.get('galleryService');

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

  saveCustomAvatarForNickname: function (nickname, files, params, callback) {
    store.getMember(nickname, function (err, member) {
      if (err) { return callback(err); }
      galleryService.storeAvatar(files.image[0].path, params, function (err, filename) {
        if (err) { return callback(err); }
        member.state.customAvatar = filename;
        store.saveMember(member, callback);
      });
    });

  },

  deleteCustomAvatarForNickname: function (nickname, callback) {
    store.getMember(nickname, function (err, member) {
      if (err || !member.hasCustomAvatar()) { return callback(err); }
      var avatar = member.customAvatar();
      delete member.state.customAvatar;
      store.saveMember(member, function (err) {
        if (err) { return callback(err); }
        galleryService.deleteAvatar(avatar, function (err) {
          callback(err);
        });
      });
    });
  },

  getImage: function (member, callback) {
    if (member.hasCustomAvatar()) {
      return galleryService.retrieveScaledImage(member.customAvatar(), 'mini', function (err, result) {
        if (err) { return callback(err); }
        fs.readFile(result, function (err, data) {
          member.setAvatarData({
            image: 'data:' + mimetypes.lookup(result) + ';base64,' + new Buffer(data).toString('base64'),
            hasNoData: false
          });
          callback(err);
        });
      });
    }
    avatarProvider.getImage(member, callback);
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

  findMemberFor: function (user, authenticationId, legacyAuthenticationId, callback) {
    return function () {
      if (!user) { // not currently logged in
        return store.getMemberForAuthentication(authenticationId, function (err, member) {
          if (err) { return callback(err); }
          // we found a member:
          if (member) { return callback(null, member); }
          // no member: let's try again with the legacy id
          store.getMemberForAuthentication(legacyAuthenticationId, function (err, member) {
            if (err || !member) {return callback(err); }
            // add the new authentication id to the member
            member.addAuthentication(authenticationId);
            store.saveMember(member, function (err) { callback(err, member); });
          });
        });
      }

      // logged in -> we don't care about the legacy id
      var memberOfSession = user.member;
      return store.getMemberForAuthentication(authenticationId, function (err, member) {
        if (err) { return callback(err); }
        if (member && memberOfSession.id() !== member.id()) { return callback(new Error('Unter dieser Authentifizierung existiert schon ein Mitglied.')); }
        if (member && memberOfSession.id() === member.id()) { return callback(null, member); }
        // no member found:
        memberOfSession.addAuthentication(authenticationId);
        store.saveMember(memberOfSession, function (err) { callback(err, memberOfSession); });
      });
    };
  },

  isReserved: isReserved
};

