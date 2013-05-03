"use strict";
var conf = require('nconf');
var fieldHelpers = conf.get('beans').get('fieldHelpers');

function valueOrFallback(value, fallback) {
  return fieldHelpers.isFilled(value) ? value : fallback;
}
function initFromSessionUser(member, sessionUser) {
  if (!sessionUser) {
    return;
  }
  member.id = sessionUser.identifier;

  var profile = sessionUser.profile;
  if (profile) {
    member.email = valueOrFallback(profile.emails[0].value, member.email);
    var name = profile.name;
    if (name) {
      member.firstname = valueOrFallback(name.givenName, member.firstname);
      member.lastname = valueOrFallback(name.familyName, member.lastname);
    }
    member.site = valueOrFallback(profile.profileUrl, member.site);
    if (profile._json && fieldHelpers.isFilled(profile._json.blog)) {
      member.site += (member.site ? ", " : "") + fieldHelpers.addPrefixTo('http://', profile._json.blog, 'https://');
    }
  }
}

function fillFromObject(member, object) {
  member.firstname = valueOrFallback(object.firstname, member.firstname);
  member.lastname = valueOrFallback(object.lastname, member.lastname);
  member.email = valueOrFallback(object.email, member.email);
  member.setTwitter(valueOrFallback(object.twitter, member.twitter));
  member.location = valueOrFallback(object.location, member.location);
  member.profession = valueOrFallback(object.profession, member.profession);
  member.interests = valueOrFallback(object.interests, member.interests);
  member.setSite(valueOrFallback(object.site, member.site));
  member.reference = valueOrFallback(object.reference, member.reference);
  member.isAdmin = !!valueOrFallback(object.isAdmin, member.isAdmin);
}

function Member(objectAndSessionUser) {
  var self = this;
  self.isAdmin = false;
  var sessionUser = objectAndSessionUser ? objectAndSessionUser.sessionUser : undefined;
  initFromSessionUser(this, sessionUser);
  if (objectAndSessionUser && objectAndSessionUser.object && objectAndSessionUser.object.nickname) {
    var object = objectAndSessionUser.object;
    self.id = valueOrFallback(object.id, self.id);
    self.nickname = object.nickname;
    fillFromObject(this, object);
  }
}

Member.prototype.setTwitter = function (twittername) {
  this.twitter = fieldHelpers.removePrefixFrom('@', twittername);
};

Member.prototype.setSite = function (siteUrl) {
  this.site = fieldHelpers.addPrefixTo('http://', siteUrl, 'https://');
};

Member.prototype.setAdminFromInteger = function (zeroOrOne) {
  this.isAdmin = !!parseInt(zeroOrOne, 10);
};

Member.prototype.adminDisplayText = function () {
  return this.isAdmin ? "Administrator" : "Normal";
};

Member.prototype.adminDropdownValue = function () {
  return this.isAdmin ? 1 : 0;
};

module.exports = Member;
