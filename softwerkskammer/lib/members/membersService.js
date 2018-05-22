'use strict';

const R = require('ramda');
const fs = require('fs');
const mimetypes = require('mime-types');

const beans = require('simple-configure').get('beans');
const store = beans.get('memberstore');
const avatarProvider = beans.get('avatarProvider');
const fieldHelpers = beans.get('fieldHelpers');
const galleryService = beans.get('galleryService');
const misc = beans.get('misc');

function isReserved(nickname) {
  return new RegExp('^edit$|^new$|^checknickname$|^submit$|^administration$|^[.][.]$|^[.]$|\\+', 'i').test(nickname);
}

function wordList(members, groupingFunction) {
  const result = [];
  const rawInterests = misc.compact(R.flatten(members.map(member => member.interestsForSelect2())));
  const groupedInterests = R.groupBy(groupingFunction, rawInterests);
  R.keys(groupedInterests).forEach(interest => {
    const mainWord = R.toPairs(R.countBy(R.identity, groupedInterests[interest])).reduce(R.maxBy(R.last))[0];
    result.push({text: mainWord, weight: groupedInterests[interest].length, html: {class: 'interestify'}});
  });
  return result;
}

function setCustomAvatarImageInMember(member, callback) {
  return galleryService.retrieveScaledImage(member.customAvatar(), 'mini', (err, result) => {
    if (err || !result) {
      if (err.message.match(/does not exist/)) {
        delete member.state.customAvatar;
      }
      return callback();
    }
    fs.readFile(result, function (err1, data) {
      member.setAvatarData({
        image: 'data:' + mimetypes.lookup(result) + ';base64,' + Buffer.from(data).toString('base64'),
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
  avatarProvider.getImage(member, imageData => {
    member.setAvatarData(imageData);
    store.saveMember(member, callback); // never, ever "fork" stuff in node by not having return values *I AM IDIOT*
  });
}

module.exports = {
  isValidNickname: function isValidNickname(nickname, callback) {
    if (fieldHelpers.containsSlash(nickname) || isReserved(nickname)) { return callback(null, false); }
    store.getMember(nickname, (err, result) => {
      if (err) { return callback(err); }
      callback(null, !result);
    });
  },

  isValidEmail: function isValidEmail(email, callback) {
    store.getMemberForEMail(email, (err, result) => {
      if (err) { return callback(err); }
      callback(null, !result);
    });
  },

  saveCustomAvatarForNickname: function saveCustomAvatarForNickname(nickname, files, params, callback) {
    store.getMember(nickname, (err, member) => {
      if (err) { return callback(err); }
      galleryService.storeAvatar(files.image[0].path, params, (err1, filename) => {
        if (err1) { return callback(err1); }
        member.setCustomAvatar(filename);
        setCustomAvatarImageInMember(member, () => { // we ignore the error here
          store.saveMember(member, callback);
        });
      });
    });
  },

  deleteCustomAvatarForNickname: function deleteCustomAvatarForNickname(nickname, callback) {
    store.getMember(nickname, (err, member) => {
      if (err || !member.hasCustomAvatar()) { return callback(err); }
      const avatar = member.customAvatar();
      member.deleteCustomAvatar();
      store.saveMember(member, err1 => {
        if (err1) { return callback(err1); }
        galleryService.deleteAvatar(avatar, err2 => { callback(err2); });
      });
    });
  },

  putAvatarIntoMemberAndSave: function putAvatarIntoMemberAndSave(member, callback) {
    if (member.getAvatarData()) { return callback(); }
    updateImage(member, callback);
  },

  updateImage,

  toWordList: function toWordList(members) {
    return wordList(members, each => each.toUpperCase());
  },

  toUngroupedWordList: function toUngroupedWordList(members) {
    return wordList(members, R.identity).sort((a, b) => a.text.localeCompare(b.text));
  },

  findMemberFor: function findMemberFor(user, authenticationId, callback) {
    return () => {
      if (!user) { // not currently logged in
        return store.getMemberForAuthentication(authenticationId, (err, member) => {
          if (err) { return callback(err); }
          return callback(null, member);
        });
      }

      // logged in -> we don't care about the legacy id, we only want to add a new authentication provider to our profile
      const memberOfSession = user.member;
      return store.getMemberForAuthentication(authenticationId, (err, member) => {
        if (err) { return callback(err); }
        if (member && memberOfSession.id() !== member.id()) { return callback(new Error('Unter dieser Authentifizierung existiert schon ein Mitglied.')); }
        if (member && memberOfSession.id() === member.id()) { return callback(null, member); }
        // no member found:
        memberOfSession.addAuthentication(authenticationId);
        store.saveMember(memberOfSession, err1 => callback(err1, memberOfSession));
      });
    };
  },

  superuserEmails: function superuserEmails(callback) {
    store.superUsers((err, members) => callback(err, members.map(member => member.email())));
  },

  isReserved
};

