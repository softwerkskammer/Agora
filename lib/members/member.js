"use strict";
function isFilled(string) {
  return string !== undefined && string.trim().length > 0 && string.trim() !== 'ERROR';
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

Member.prototype.updateWith = function (object, sessionUser) {
  if (sessionUser) {
    this.id = sessionUser.identifier;
    this.firstname = isFilled(object.firstName) ? object.firstname : sessionUser.profile.name.givenName;
    this.lastname = isFilled(object.firstName) ? object.lastname : sessionUser.profile.name.familyName;
  }
  if (object) {
    this.nickname = object.nickname;
    this.email = object.email;
    this.twitter = object.twitter;
    this.location = object.location;
    this.profession = object.profession;
    this.interests = object.interests;
    this.site = object.site;
    this.reference = object.reference;
  }
  return this;
}
;

Member.prototype.isValid = function () {
  return isFilled(this.id) && isFilled(this.nickname);
};

module.exports = Member;
