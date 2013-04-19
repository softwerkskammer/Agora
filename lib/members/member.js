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
  this.twitter = twittername ? twittername.replace(/^@/, '') : null;
};

Member.prototype.setAdminFromInteger = function (zeroOrOne) {
  this.isAdmin = !!parseInt(zeroOrOne, 10);
};

Member.prototype.isValid = function () {
  return isFilled(this.id) && isFilled(this.nickname);
};

Member.prototype.adminDisplayText = function () {
  return this.isAdmin ? "Administrator" : "Normal";
};

Member.prototype.adminDropdownValue = function () {
  return this.isAdmin ? 1 : 0;
};

module.exports = Member;
