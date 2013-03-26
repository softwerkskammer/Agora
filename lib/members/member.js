"use strict";

function Member(nickname, firstname, lastname, email, twitter, location, profession, interests, site, reference) {
  this.id = nickname;
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
  this.id = object.nickname;
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

Member.prototype.isValid = function () {
  return this.id !== undefined;
};

module.exports = Member;
