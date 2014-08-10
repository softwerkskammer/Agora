'use strict';

var conf = require('nconf');
var store = conf.get('beans').get('memberstore');
var avatarProvider = conf.get('beans').get('avatarProvider');

function isReserved(nickname) {
  return new RegExp('^edit$|^new$|^checknickname$|^submit$|^administration$|^[.][.]$|^[.]$|\\+', 'i').test(nickname);
}

module.exports = {
  isValidNickname: function (nickname, callback) {
    if (isReserved(nickname)) { return callback(null, false); }
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
    var interests = [];
    members.forEach(function (member) {
      if (member.interests()) {
        interests = interests.concat(member.interests().split(','));
      }
    });

    var memberInterests = {};
    interests.map(function (a) {
      if (memberInterests.hasOwnProperty(a)) {
        memberInterests[a] = memberInterests[a] + 1;
      } else {
        memberInterests[a] = 1;
      }
    });

    var wordList = [];

    Object.keys(memberInterests).forEach(function (interest) {
      wordList.push({text: interest, weight: memberInterests[interest]});
    });
    return wordList;
  },

  isReserved: isReserved
};

