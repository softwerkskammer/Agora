"use strict";
const { DateTime } = require("luxon");
const R = require("ramda");

const conf = require("simple-configure");
const beans = conf.get("beans");
const fieldHelpers = require("../commons/fieldHelpers");
const avatarProvider = require("../commons/avatarProvider");
const { genSalt, hashPassword } = beans.get("hashPassword");

class Member {
  constructor(object) {
    this.state = object || {};
  }

  fillFromUI(object) {
    ["nickname", "firstname", "lastname", "email", "location", "profession", "reference", "customAvatar"].forEach(
      (property) => {
        if (object[property]) {
          this.state[property] = object[property].trim();
        }
      },
    );
    ["notifyOnWikiChanges"].forEach((property) => {
      this.state[property] = !!object[property];
    });
    if (object.twitter) {
      this.state.twitter = fieldHelpers.removePrefixFrom("@", object.twitter.trim());
    }
    if (object.site) {
      this.state.site = fieldHelpers.addPrefixTo("http://", object.site.trim(), "https://");
    }
    if (object.interests) {
      this.state.interests = object.interests.toString();
    }
    if (object.password) {
      this.updatePassword(object.password);
    }

    return this;
  }

  displayName() {
    return this.firstname() + " " + this.lastname();
  }

  initFromSessionUser(sessionUser) {
    /* eslint no-underscore-dangle: 0 */
    // this is THE ONLY VALID WAY to create and initialize a new user in real life (not tests)
    if (!sessionUser || this.id()) {
      return this;
    }
    this.state.created = DateTime.local().toFormat("dd.MM.yy");
    this.state.id = sessionUser.authenticationId;
    const profile = sessionUser.profile;
    if (profile) {
      this.state.email = fieldHelpers.valueOrFallback(
        profile.emails && profile.emails[0] && profile.emails[0].value,
        this.email(),
      );
      const name = profile.name;
      if (name) {
        this.state.firstname = fieldHelpers.valueOrFallback(name.givenName, this.firstname());
        this.state.lastname = fieldHelpers.valueOrFallback(name.familyName, this.lastname());
      }
      if (profile.password) {
        this.updatePassword(profile.password);
      }
      this.state.site = fieldHelpers.valueOrFallback(profile.profileUrl, this.site());
      if (profile._json && fieldHelpers.isFilled(profile._json.blog)) {
        this.state.site +=
          (this.site() ? ", " : "") + fieldHelpers.addPrefixTo("http://", profile._json.blog, "https://");
      }
    }
    return this;
  }

  avatarUrl(size) {
    if (this.hasCustomAvatar()) {
      return "/gallery/avatarFor/" + this.customAvatar();
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
    return (this.getAvatarData() && this.getAvatarData().image) || "";
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
    return this.nickname() + " <" + this.nickname() + "@softwerkskammer.org>";
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
    return this.interestsForSelect2().join(", ");
  }

  interestsForSelect2() {
    return (this.state.interests || "").split(",").map((s) => s.trim());
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
    return (
      this.subscribedGroups &&
      R.flatten(this.subscribedGroups.map((group) => group.organizers)).some((organizer) => organizer === this.id())
    );
  }

  isInGroup(groupId) {
    return this.subscribedGroups && this.subscribedGroups.some((group) => group.id === groupId);
  }

  isSuperuser() {
    return Member.isSuperuser(this.id());
  }

  fillSubscribedGroups(groups) {
    this.subscribedGroups = groups.filter((g) => g.subscribedMembers.includes(this.id()));
  }

  updatePassword(newPassword) {
    this.state.salt = genSalt();
    this.state.hashedPassword = hashPassword(newPassword, this.state.salt);
  }

  salt() {
    return this.state.salt;
  }

  hashedPassword() {
    return this.state.hashedPassword;
  }

  passwordMatches(password) {
    return hashPassword(password, this.salt()) === this.hashedPassword();
  }

  static isSuperuser(id) {
    const superusers = conf.get("superuser");
    return superusers && superusers.indexOf(id) > -1;
  }

  static wikiNotificationMembers(members) {
    return members.filter((member) => member.notifyOnWikiChanges()).map((member) => member.email());
  }

  static superuserEmails(members) {
    return members.filter((member) => member.isSuperuser()).map((member) => member.email());
  }

  static memberIsInMemberList(id, members) {
    return members.some((member) => member.id() === id);
  }
}

module.exports = Member;
