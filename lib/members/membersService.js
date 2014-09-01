'use strict';

var conf = require('nconf');
var store = conf.get('beans').get('memberstore');
var avatarProvider = conf.get('beans').get('avatarProvider');
var _ = require('lodash');

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
    return _(members).map(function (member) {
      return member.interests() && member.interests().split(',').map(function (interest) {
        //remove quotes and other special characters, feel free to add more
        return interest.replace(/['"()]/g, '').trim();
      });
    })
      .flatten() // now we have all words in one collection
      .compact() // remove empty strings
      .groupBy(function (each) { return each.toUpperCase(); }) // prepare counting by grouping 
      .transform(function (result, words) {
        var mainWord = _(words).groupBy().max(function (word) { return word.length; }).uniq().value()[0]; // choose the most common form 
        return result.push({text: mainWord, weight: words.length, link: '/members/interests/' + mainWord});
      }, []) // create the final structure
      .value(); // unwrap the array
  },

  isReserved: isReserved
};

