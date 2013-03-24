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
module.exports = Member;
