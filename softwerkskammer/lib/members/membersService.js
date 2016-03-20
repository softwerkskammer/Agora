'use strict';

var _ = require('lodash');
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
      var mainWord = _(words).groupBy().max(function (word) { return word.length; })[0]; // choose the most common form
      return result.push({text: mainWord, weight: words.length, html: {class: 'interestify'}});
    }, []); // create the final structure
}

function setCustomAvatarImageInMember(member, callback) {
  return galleryService.retrieveScaledImage(member.customAvatar(), 'mini', function (err, result) {
    if (err || !result) {
      if (err.message.match(/does not exist/)) {
        delete member.state.customAvatar;
      }
      return callback();
    }
    fs.readFile(result, function (err1, data) {
      member.setAvatarData({
        image: 'data:' + mimetypes.lookup(result) + ';base64,' + new Buffer(data).toString('base64'),
        hasNoImage: false
      });
      callback(err1);
    });
  });
}

function updateImage(member, callback) { // to be called at regular intervals
  if (member.hasCustomAvatar()) {
    return callback();
  }
  avatarProvider.getImage(member, function (imageData) {
    member.setAvatarData(imageData);
    store.saveMember(member, callback); // never, ever "fork" stuff in node by not having return values *I AM IDIOT*
  });
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
      galleryService.storeAvatar(files.image[0].path, params, function (err1, filename) {
        if (err1) { return callback(err1); }
        member.setCustomAvatar(filename);
        setCustomAvatarImageInMember(member, function () { // we ignore the error here
          store.saveMember(member, callback);
        });
      });
    });
  },

  deleteCustomAvatarForNickname: function (nickname, callback) {
    store.getMember(nickname, function (err, member) {
      if (err || !member.hasCustomAvatar()) { return callback(err); }
      var avatar = member.customAvatar();
      member.deleteCustomAvatar();
      store.saveMember(member, function (err1) {
        if (err1) { return callback(err1); }
        galleryService.deleteAvatar(avatar, function (err2) { callback(err2); });
      });
    });
  },

  putAvatarIntoMemberAndSave: function (member, callback) {
    if (member.getAvatarData()) { return callback(); }
    updateImage(member, callback);
  },

  updateImage: updateImage,

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
          if (legacyAuthenticationId) {
            return store.getMemberForAuthentication(legacyAuthenticationId, function (err1, member1) {
              if (err1 || !member1) {return callback(err1); }
              if (authenticationId) {
                // add the new authentication id to the member
                member1.addAuthentication(authenticationId);
                return store.saveMember(member1, function (err2) { callback(err2, member1); });
              }
              callback(null, member1);
            });
          }
          return callback(null);
        });
      }

      // logged in -> we don't care about the legacy id, we only want to add a new authentication provider to our profile
      var memberOfSession = user.member;
      return store.getMemberForAuthentication(authenticationId, function (err, member) {
        if (err) { return callback(err); }
        if (member && memberOfSession.id() !== member.id()) { return callback(new Error('Unter dieser Authentifizierung existiert schon ein Mitglied.')); }
        if (member && memberOfSession.id() === member.id()) { return callback(null, member); }
        // no member found:
        memberOfSession.addAuthentication(authenticationId);
        store.saveMember(memberOfSession, function (err1) { callback(err1, memberOfSession); });
      });
    };
  },

  superuserEmails: function (callback) {
    store.superUsers(function (err, members) {
      callback(err, _.map(members, function (member) { return member.email(); }));
    });
  },

  isReserved: isReserved
};

