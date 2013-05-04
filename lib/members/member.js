"use strict";
var conf = require('nconf');
var fieldHelpers = conf.get('beans').get('fieldHelpers');

function initFromSessionUser(member, sessionUser) {
  if (!sessionUser) {
    return;
  }
  member.id = sessionUser.identifier;

  var profile = sessionUser.profile;
  if (profile) {
    member.email = fieldHelpers.valueOrFallback(profile.emails[0].value, member.email);
    var name = profile.name;
    if (name) {
      member.firstname = fieldHelpers.valueOrFallback(name.givenName, member.firstname);
      member.lastname = fieldHelpers.valueOrFallback(name.familyName, member.lastname);
    }
    member.site = fieldHelpers.valueOrFallback(profile.profileUrl, member.site);
    if (profile._json && fieldHelpers.isFilled(profile._json.blog)) {
      member.site += (member.site ? ", " : "") + fieldHelpers.addPrefixTo('http://', profile._json.blog, 'https://');
    }
  }
}

function fillFromObject(member, object) {
  member.firstname = fieldHelpers.valueOrFallback(object.firstname, member.firstname);
  member.lastname = fieldHelpers.valueOrFallback(object.lastname, member.lastname);
  member.email = fieldHelpers.valueOrFallback(object.email, member.email);
  member.setTwitter(fieldHelpers.valueOrFallback(object.twitter, member.twitter));
  member.location = fieldHelpers.valueOrFallback(object.location, member.location);
  member.profession = fieldHelpers.valueOrFallback(object.profession, member.profession);
  member.interests = fieldHelpers.valueOrFallback(object.interests, member.interests);
  member.setSite(fieldHelpers.valueOrFallback(object.site, member.site));
  member.reference = fieldHelpers.valueOrFallback(object.reference, member.reference);
  member.isAdmin = !!fieldHelpers.valueOrFallback(object.isAdmin, member.isAdmin);
}

function Member(objectAndSessionUser) {
  var self = this;
  self.isAdmin = false;
  var sessionUser = objectAndSessionUser ? objectAndSessionUser.sessionUser : undefined;
  initFromSessionUser(this, sessionUser);
  if (objectAndSessionUser && objectAndSessionUser.object && objectAndSessionUser.object.nickname) {
    var object = objectAndSessionUser.object;
    self.id = fieldHelpers.valueOrFallback(object.id, self.id);
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
