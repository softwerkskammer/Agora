"use strict";
var conf = require('nconf');
var fieldHelpers = conf.get('beans').get('fieldHelpers');
var moment = require('moment-timezone');
var _ = require('underscore');

function Member(object) {
  this.state = object || {};
}

Member.prototype.fillFromUI = function (object) {
  this.state.nickname = object.nickname;
  this.state.firstname = object.firstname;
  this.state.lastname = object.lastname;
  this.state.email = object.email;
  this.state.twitter = fieldHelpers.removePrefixFrom('@', object.twitter);
  this.state.site = fieldHelpers.addPrefixTo('http://', object.site, 'https://');
  this.state.location = object.location;
  this.state.profession = object.profession;
  this.state.interests = object.interests;
  this.state.reference = object.reference;
  this.state.isAdmin = !!object.isAdmin;
};

Member.prototype.setSite = function (siteUrl) {
  this.site = fieldHelpers.addPrefixTo('http://', siteUrl, 'https://');
};

Member.prototype.setAdminFromInteger = function (zeroOrOne) {
  this.state.isAdmin = !!parseInt(zeroOrOne, 10);
};

Member.prototype.adminDisplayText = function () {
  return this.isAdmin() ? "Administrator" : "Normal";
};

Member.prototype.adminDropdownValue = function () {
  return this.isAdmin() ? 1 : 0;
};

Member.prototype.displayName = function () {
  return this.firstname() + ' ' + this.lastname();
};

Member.prototype.initFromSessionUser = function (sessionUser) {
  // this is THE ONLY VALID WAY to create and initialize a new user in real life (not tests) 
  if (!sessionUser || this.id()) {
    return this;
  }
  this.state.created = moment().format('DD.MM.YY');
  this.state.id = sessionUser.authenticationId;

  var profile = sessionUser.profile;
  if (profile) {
    this.state.email = fieldHelpers.valueOrFallback(profile.emails[0].value, this.email());
    var name = profile.name;
    if (name) {
      this.state.firstname = fieldHelpers.valueOrFallback(name.givenName, this.firstname());
      this.state.lastname = fieldHelpers.valueOrFallback(name.familyName, this.lastname());
    }
    this.state.site = fieldHelpers.valueOrFallback(profile.profileUrl, this.site());
    if (profile._json && fieldHelpers.isFilled(profile._json.blog)) {
      this.state.site += (this.site() ? ", " : "") + fieldHelpers.addPrefixTo('http://', profile._json.blog, 'https://');
    }
  }
  return this;
};

Member.prototype.avatarUrl = function (size) {
  return 'http://www.gravatar.com/avatar/' + fieldHelpers.md5(this.email()) + '?d=blank&s=' + (size ? size : 32);
};

Member.prototype.asGitAuthor = function () {
  return this.nickname() + ' <' + this.nickname() + '@softwerkskammer.org>';
};

Member.prototype.addAuthentication = function (authenticationId) {
  this.state.authentications.push(authenticationId);
  this.state.authentications = _.uniq(this.authentications());
};

Member.prototype.id = function () {
  return this.state.id;
};

Member.prototype.nickname = function () {
  return this.state.nickname;
};

Member.prototype.firstname = function () {
  return this.state.firstname;
};

Member.prototype.lastname = function () {
  return this.state.lastname;
};

Member.prototype.email = function () {
  return this.state.email;
};

Member.prototype.location = function () {
  return this.state.location;
};

Member.prototype.profession = function () {
  return this.state.profession;
};

Member.prototype.interests = function () {
  return this.state.interests;
};

Member.prototype.reference = function () {
  return this.state.reference;
};

Member.prototype.authentications = function () {
  if (!this.state.authentications) {
    this.state.authentications = [];
    this.addAuthentication(this.id());
  }
  return this.state.authentications;
};

Member.prototype.twitter = function () {
  return this.state.twitter;
};

Member.prototype.site = function () {
  return this.state.site;
};

Member.prototype.created = function () {
  return this.state.created;
};

// TODO delete this method and the isAdmin property
Member.prototype.isAdmin = function () {
  return this.state.isAdmin || false;
};

module.exports = Member;
