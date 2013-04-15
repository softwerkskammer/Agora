"use strict";
function isFilled(someValue) {
  return someValue !== undefined && someValue !== null &&
    typeof (someValue) === 'String' ? someValue.trim().length > 0 : true;
}

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

function fillFromObject(member, object) {
  member.firstname = valueOrFallback(object.firstname, member.firstname);
  member.lastname = valueOrFallback(object.lastname, member.lastname);
  member.email = valueOrFallback(object.email, member.email);
  member.setTwitter(valueOrFallback(object.twitter, member.twitter));
  member.location = valueOrFallback(object.location, member.location);
  member.profession = valueOrFallback(object.profession, member.profession);
  member.interests = valueOrFallback(object.interests, member.interests);
  member.site = valueOrFallback(object.site, member.site);
  member.reference = valueOrFallback(object.reference, member.reference);
  member.isAdmin = !!valueOrFallback(object.isAdmin, member.isAdmin);
}

function Member() {
  this.id = undefined;
  this.nickname = undefined;
  this.firstname = undefined;
  this.lastname = undefined;
  this.email = undefined;
  this.setTwitter(undefined);
  this.location = undefined;
  this.profession = undefined;
  this.interests = undefined;
  this.site = undefined;
  this.reference = undefined;
  this.isAdmin = false;
}

Member.prototype.fromObject = function (object) {
  this.id = object.id;
  this.nickname = object.nickname;
  fillFromObject(this, object);
  return this;
};

Member.prototype.setTwitter = function (twittername) {
  this.twitter = twittername ? twittername.replace(/^@/, '') : null;
};

Member.prototype.isValid = function () {
  return isFilled(this.id) && isFilled(this.nickname);
};

Member.prototype.updateWith = function (object, sessionUser) {
  initFromSessionUser(this, sessionUser);
  if (object && object.nickname) {
    this.nickname = object.nickname;
    this.id = valueOrFallback(object.id, this.id);
    fillFromObject(this, object);
  }
  return this;
};

module.exports = Member;
