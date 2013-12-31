"use strict";
var conf = require('nconf');
var fieldHelpers = conf.get('beans').get('fieldHelpers');
var moment = require('moment-timezone');
var _ = require('underscore');

function Member(object) {
  this.isAdmin = false;
  if (object && object.nickname) {
    this.id = object.id;
    this.nickname = object.nickname;
    this.firstname = object.firstname;
    this.lastname = object.lastname;
    this.email = object.email;
    this.setTwitter(object.twitter);
    this.location = object.location;
    this.profession = object.profession;
    this.interests = object.interests;
    this.setSite(object.site);
    this.reference = object.reference;
    this.isAdmin = !!object.isAdmin;
    this.created = object.created;
    this.authentications = object.authentications;
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
  this.id = sessionUser.authenticationId;

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
  return 'http://www.gravatar.com/avatar/' + fieldHelpers.md5(this.email) + '?d=blank&s=' + (size ? size : 32);
};

Member.prototype.asGitAuthor = function () {
  return this.nickname + ' <' + this.nickname + '@softwerkskammer.org>';
};

Member.prototype.addAuthentication = function (authenticationId) {
  this.authentications.push(authenticationId);
  this.authentications = _.uniq(this.authentications);
};

module.exports = Member;
