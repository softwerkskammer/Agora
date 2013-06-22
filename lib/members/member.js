"use strict";
var conf = require('nconf');
var fieldHelpers = conf.get('beans').get('fieldHelpers');
var moment = require('moment');
var crypto = require('crypto');
function md5(text) {
  return crypto.createHash('md5').update(text).digest("hex");
}

function fillFromObject(member, object) {
  member.id = fieldHelpers.valueOrFallback(object.id, member.id);
  member.nickname = fieldHelpers.valueOrFallback(object.nickname, member.nickname);
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
  member.created = fieldHelpers.valueOrFallback(object.created, member.created);
}

function Member(object) {
  var self = this;
  self.isAdmin = false;
  if (object && object.nickname) {
    fillFromObject(self, object);
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

Member.prototype.displayName = function () {
  return this.firstname + ' ' + this.lastname;
};

Member.prototype.initFromSessionUser = function (sessionUser) {
  // this is THE ONLY VALID WAY to create and initialize a new user in real life (not tests) 
  if (!sessionUser || this.id) {
    return this;
  }
  this.created = moment().format('DD.MM.YY');
  this.id = sessionUser.identifier;

  var profile = sessionUser.profile;
  if (profile) {
    this.email = fieldHelpers.valueOrFallback(profile.emails[0].value, this.email);
    var name = profile.name;
    if (name) {
      this.firstname = fieldHelpers.valueOrFallback(name.givenName, this.firstname);
      this.lastname = fieldHelpers.valueOrFallback(name.familyName, this.lastname);
    }
    this.site = fieldHelpers.valueOrFallback(profile.profileUrl, this.site);
    if (profile._json && fieldHelpers.isFilled(profile._json.blog)) {
      this.site += (this.site ? ", " : "") + fieldHelpers.addPrefixTo('http://', profile._json.blog, 'https://');
    }
  }
  return this;
};

Member.prototype.avatarUrl = function (size) {
  if (!size) {
    size = 32;
  }
  var hash;
  if (this.email) {
    hash = md5(this.email);
  }
  else {
    hash = "0";
  }
  return 'http://www.gravatar.com/avatar/' + hash + '?d=blank&s=' + size;
};

module.exports = Member;
