'use strict';
var conf = require('simple-configure');
var beans = conf.get('beans');
var fieldHelpers = beans.get('fieldHelpers');
var avatarProvider = beans.get('avatarProvider');
var moment = require('moment-timezone');
var _ = require('lodash');

function Member(object) {
  this.state = object || {};
}

Member.prototype.fillFromUI = function (object) {
  var self = this;
  _.each(['nickname', 'firstname', 'lastname', 'email', 'location', 'profession', 'interests', 'reference', 'customAvatar'], function (property) {
    if (object.hasOwnProperty(property)) { self.state[property] = object[property]; }
  });
  _.each(['notifyOnWikiChanges', 'socratesOnly'], function (property) {
    if (object.hasOwnProperty(property)) { self.state[property] = !!object[property]; }
  });
  if (object.hasOwnProperty('twitter')) {
    self.state.twitter = fieldHelpers.removePrefixFrom('@', object.twitter);
  }
  if (object.hasOwnProperty('site')) {
    self.state.site = fieldHelpers.addPrefixTo('http://', object.site, 'https://');
  }

  return self;
};

Member.prototype.setSite = function (siteUrl) {
  this.site = fieldHelpers.addPrefixTo('http://', siteUrl, 'https://');
};

Member.prototype.displayName = function () {
  return this.firstname() + ' ' + this.lastname();
};

Member.prototype.initFromSessionUser = function (sessionUser, socratesOnly) {
  // this is THE ONLY VALID WAY to create and initialize a new user in real life (not tests) 
  if (!sessionUser || this.id()) {
    return this;
  }
  this.state.created = moment().format('DD.MM.YY');
  this.state.id = sessionUser.authenticationId;

  var profile = sessionUser.profile;
  if (profile) {
    this.state.email = fieldHelpers.valueOrFallback(profile.emails && profile.emails[0] && profile.emails[0].value, this.email());
    var name = profile.name;
    if (name) {
      this.state.firstname = fieldHelpers.valueOrFallback(name.givenName, this.firstname());
      this.state.lastname = fieldHelpers.valueOrFallback(name.familyName, this.lastname());
    }
    this.state.site = fieldHelpers.valueOrFallback(profile.profileUrl, this.site());
    if (profile._json && fieldHelpers.isFilled(profile._json.blog)) {
      this.state.site += (this.site() ? ', ' : '') + fieldHelpers.addPrefixTo('http://', profile._json.blog, 'https://');
    }
  }
  this.state.socratesOnly = !!socratesOnly;
  return this;
};

Member.prototype.avatarUrl = function (size) {
  if (this.hasCustomAvatar()) {
    return '/gallery/avatarFor/' + this.customAvatar();
  }
  return avatarProvider.avatarUrl(this.email(), size || 200);
};

Member.prototype.setAvatarData = function (data) {
  this.avatarImage = data.image;
  this.hasNoImage = data.hasNoImage;
};

Member.prototype.inlineAvatar = function () {
  return this.avatarImage || '';
};

Member.prototype.hasCustomAvatar = function () {
  return !!this.state.customAvatar;
};

Member.prototype.customAvatar = function () {
  return this.state.customAvatar;
};

Member.prototype.asGitAuthor = function () {
  return this.nickname() + ' <' + this.nickname() + '@softwerkskammer.org>';
};

Member.prototype.addAuthentication = function (authenticationId) {
  if (!this.state.authentications) {
    this.state.authentications = [];
  }
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

Member.prototype.notifyOnWikiChanges = function () {
  return this.state.notifyOnWikiChanges;
};

Member.prototype.isContactperson = function () {
  return this.subscribedGroups && _(this.subscribedGroups).pluck('organizers').flatten().uniq().value().indexOf(this.id()) > -1;
};

Member.prototype.isInGroup = function (groupId) {
  return !!this.subscribedGroups && _.some(this.subscribedGroups, {id: groupId});
};

Member.prototype.isSuperuser = function () {
  return Member.isSuperuser(this.id());
};

Member.prototype.socratesOnly = function () {
  return this.state.socratesOnly;
};

Member.isSuperuser = function (id) {
  var superusers = conf.get('superuser');
  return superusers && superusers.indexOf(id) > -1;
};

Member.wikiNotificationMembers = function (members) {
  return _(members).filter(function (member) { return member.notifyOnWikiChanges(); }).map(function (member) {return member.email(); }).value();
};

Member.superuserEmails = function (members) {
  return _(members).filter(function (member) { return member.isSuperuser(); }).map(function (member) {return member.email(); }).value();
};

module.exports = Member;
