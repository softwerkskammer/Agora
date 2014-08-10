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
    var allInterests = [];
    members.forEach(function (member) {
      if (member.interests()) {
        var currentMembersInterest = member.interests().split(',').map(function (interest) {
          //remove quotes and other special characters, feel free to add more
          return interest.replace(/['"()]/g, '');
        });
        allInterests = allInterests.concat(currentMembersInterest);
      }
    });

    var memberInterestsHash = {};
    allInterests.map(function (a) {
      if (memberInterestsHash.hasOwnProperty(a)) {
        memberInterestsHash[a] = memberInterestsHash[a] + 1;
      } else {
        memberInterestsHash[a] = 1;
      }
    });

    var wordList = [];

    Object.keys(memberInterestsHash).forEach(function (interest) {
      wordList.push({text: interest, weight: encodeURIComponent(memberInterestsHash[interest])});
    });
    return wordList;
  },

  isReserved: isReserved
};

