'use strict';
const conf = require('simple-configure');
const beans = conf.get('beans');
const fieldHelpers = beans.get('fieldHelpers');
const avatarProvider = beans.get('avatarProvider');
const moment = require('moment-timezone');
const R = require('ramda');

class Member {
  constructor(object) {
    this.state = object || {};
  }

  fillFromUI(object) {
    ['nickname', 'firstname', 'lastname', 'email', 'location', 'profession', 'reference', 'customAvatar'].forEach(property => {
      if (object.hasOwnProperty(property) && object[property]) { this.state[property] = object[property].trim(); }
    });
    ['notifyOnWikiChanges', 'socratesOnly'].forEach(property => {
      this.state[property] = !!object[property];
    });
    if (object.twitter) {
      this.state.twitter = fieldHelpers.removePrefixFrom('@', object.twitter.trim());
    }
    if (object.site) {
      this.state.site = fieldHelpers.addPrefixTo('http://', object.site.trim(), 'https://');
    }
    if (object.interests) {
      this.state.interests = object.interests.toString();
    }

    return this;
  }

  displayName() {
    return this.firstname() + ' ' + this.lastname();
  }

  initFromSessionUser(sessionUser, socratesOnly) {
    /* eslint no-underscore-dangle: 0 */
    // this is THE ONLY VALID WAY to create and initialize a new user in real life (not tests)
    if (!sessionUser || this.id()) {
      return this;
    }
    this.state.created = moment().format('DD.MM.YY');
    this.state.id = sessionUser.authenticationId;

    const profile = sessionUser.profile;
    if (profile) {
      this.state.email = fieldHelpers.valueOrFallback(profile.emails && profile.emails[0] && profile.emails[0].value, this.email());
      const name = profile.name;
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
  }

  avatarUrl(size) {
    if (this.hasCustomAvatar()) {
      return '/gallery/avatarFor/' + this.customAvatar();
    }
    return avatarProvider.avatarUrl(this.email(), size || 200);
  }

  hasImage() {
    return (this.getAvatarData() && this.getAvatarData().hasNoImage) === false;
  }

  setAvatarData(data) {
    this.state.avatardata = data;
  }

  getAvatarData() {
    return this.state.avatardata;
  }

  inlineAvatar() {
    return (this.getAvatarData() && this.getAvatarData().image) || '';
  }

  hasCustomAvatar() {
    return !!this.customAvatar();
  }

  customAvatar() {
    return this.state.customAvatar;
  }

  setCustomAvatar(data) {
    this.state.customAvatar = data;
  }

  deleteCustomAvatar() {
    delete this.state.customAvatar;
    delete this.state.avatardata;
  }

  asGitAuthor() {
    return this.nickname() + ' <' + this.nickname() + '@softwerkskammer.org>';
  }

  addAuthentication(authenticationId) {
    if (!this.state.authentications) {
      this.state.authentications = [];
    }
    if (authenticationId) {
      this.state.authentications.push(authenticationId);
      this.state.authentications = R.uniq(this.authentications());
    }
  }

  id() {
    return this.state.id;
  }

  nickname() {
    return this.state.nickname;
  }

  firstname() {
    return this.state.firstname;
  }

  lastname() {
    return this.state.lastname;
  }

  email() {
    return this.state.email;
  }

  location() {
    return this.state.location;
  }

  profession() {
    return this.state.profession;
  }

  interests() {
    return this.state.interests;
  }

  interestsForSelect2() {
    return (this.interests() || '').split(',').map(s => s.trim());
  }

  reference() {
    return this.state.reference;
  }

  authentications() {
    return this.state.authentications;
  }

  twitter() {
    return this.state.twitter;
  }

  site() {
    return this.state.site;
  }

  created() {
    return this.state.created;
  }

  notifyOnWikiChanges() {
    return this.state.notifyOnWikiChanges;
  }

  isContactperson() {
    return this.subscribedGroups && R.flatten(this.subscribedGroups.map(group => group.organizers)).some(organizer => organizer === this.id());
  }

  isInGroup(groupId) {
    return this.subscribedGroups && this.subscribedGroups.some(group => group.id === groupId);
  }

  isSuperuser() {
    return Member.isSuperuser(this.id());
  }

  socratesOnly() {
    return this.state.socratesOnly;
  }

  fillSubscribedGroups(groupNamesWithEmails, groups) {
    const result = [];
    R.keys(groupNamesWithEmails).forEach(name => {
      if (groupNamesWithEmails[name].includes(this.email().toLowerCase())) {
        result.push(groups.find(group => group.id === name));
      }
    });
    this.subscribedGroups = result;
  }

  static isSuperuser(id) {
    const superusers = conf.get('superuser');
    return superusers && superusers.indexOf(id) > -1;
  }

  static wikiNotificationMembers(members) {
    return members.filter(member => member.notifyOnWikiChanges()).map(member => member.email());
  }

  static superuserEmails(members) {
    return members.filter(member => member.isSuperuser()).map(member => member.email());
  }
}

module.exports = Member;
