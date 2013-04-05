"use strict";
function isFilled(string) {
  return string !== undefined && string !== null && string.trim().length > 0;
}

function Member(id, nickname, firstname, lastname, email, twitter, location, profession, interests, site, reference) {
  this.id = id;
  this.nickname = nickname;
  this.firstname = firstname;
  this.lastname = lastname;
  this.email = email;
  this.twitter = twitter;
  this.location = location;
  this.profession = profession;
  this.interests = interests;
  this.site = site;
  this.reference = reference;
}

Member.prototype.fromObject = function (object) {
  this.id = object.id;
  this.nickname = object.nickname;
  this.firstname = object.firstname;
  this.lastname = object.lastname;
  this.email = object.email;
  this.twitter = object.twitter;
  this.location = object.location;
  this.profession = object.profession;
  this.interests = object.interests;
  this.site = object.site;
  this.reference = object.reference;
  return this;
};

function valueOrFallback(value, fallback) {
  return isFilled(value) ? value : fallback;
}
function initFromSessionUser(member, sessionUser) {
  if (!sessionUser) {
    return;
  }
  var profile = sessionUser.profile;

  member.id = sessionUser.identifier;
  member.email = valueOrFallback(profile.emails[0].value, member.email);
  var name = profile.name;
  if (name) {
    member.firstname = valueOrFallback(name.givenName, member.firstname);
    member.lastname = valueOrFallback(name.familyName, member.lastname);
  }
  member.site = valueOrFallback(profile.profileUrl, member.site);
  if (profile._json && isFilled(profile._json.blog)) {
    member.site += (member.site ? ", " : "") + profile._json.blog;
  }
}

Member.prototype.updateWith = function (object, sessionUser) {
  initFromSessionUser(this, sessionUser);
  if (object) {
    this.firstname = valueOrFallback(object.firstname, this.firstname);
    this.lastname = valueOrFallback(object.lastname, this.lastname);
    this.nickname = object.nickname;
    this.email = valueOrFallback(object.email, this.email);
    this.twitter = valueOrFallback(object.twitter, this.twitter);
    this.location = valueOrFallback(object.location, this.location);
    this.profession = valueOrFallback(object.profession, this.profession);
    this.interests = valueOrFallback(object.interests, this.interests);
    this.site = valueOrFallback(object.site, this.site);
    this.reference = valueOrFallback(object.reference, this.reference);
  }
  return this;
}
;

Member.prototype.isValid = function () {
  return isFilled(this.id) && isFilled(this.nickname);
};

module.exports = Member;
