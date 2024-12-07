"use strict";
const R = require("ramda");
const fsProm = require("fs/promises");
const mimetypes = require("mime-types");

const beans = require("simple-configure").get("beans");
const store = beans.get("memberstore");
const avatarProvider = beans.get("avatarProvider");
const fieldHelpers = require("../commons/fieldHelpers");
const galleryService = beans.get("galleryService");
const misc = beans.get("misc");

function isReserved(nickname) {
  return new RegExp("^edit$|^new$|^checknickname$|^submit$|^administration$|^[.][.]$|^[.]$|\\+", "i").test(nickname);
}

function wordList(members, groupingFunction) {
  const result = [];
  const rawInterests = misc.compact(R.flatten(members.map((member) => member.interestsForSelect2())));
  const groupedInterests = R.groupBy(groupingFunction, rawInterests);
  R.keys(groupedInterests).forEach((interest) => {
    const mainWord = R.toPairs(R.countBy(R.identity, groupedInterests[interest])).reduce(R.maxBy(R.last))[0];
    result.push({ text: mainWord, weight: groupedInterests[interest].length, html: { class: "interestify" } });
  });
  return result;
}

async function setCustomAvatarImageInMember(member) {
  try {
    const result = await galleryService.retrieveScaledImage(member.customAvatar(), "mini");
    if (!result) {
      delete member.state.customAvatar;
    }
    const data = await fsProm.readFile(result);
    member.setAvatarData({
      image: "data:" + mimetypes.lookup(result) + ";base64," + Buffer.from(data).toString("base64"),
      hasNoImage: false,
    });
  } catch (e) {
    if (e.message.match(/does not exist/)) {
      delete member.state.customAvatar;
    }
  }
}

async function updateImage(member) {
  // to be called at regular intervals
  if (member.hasCustomAvatar()) {
    return;
  }
  const imageData = await avatarProvider.getImage(member);
  member.setAvatarData(imageData);
  return store.saveMember(member);
}

module.exports = {
  isValidNickname: function isValidNickname(nickname) {
    if (fieldHelpers.containsSlash(nickname) || isReserved(nickname)) {
      return false;
    }
    return !store.getMember(nickname);
  },

  isValidEmail: function isValidEmail(email) {
    return !store.getMemberForEMail(email);
  },

  saveCustomAvatarForNickname: async function saveCustomAvatarForNickname(nickname, files, params) {
    const member = store.getMember(nickname);
    const filename = await galleryService.storeAvatar(files.image[0].path, params);
    member.setCustomAvatar(filename);
    await setCustomAvatarImageInMember(member);
    return store.saveMember(member);
  },

  deleteCustomAvatarForNickname: async function deleteCustomAvatarForNickname(nickname) {
    const member = store.getMember(nickname);
    if (!member.hasCustomAvatar()) {
      return;
    }
    const avatar = member.customAvatar();
    member.deleteCustomAvatar();
    store.saveMember(member);
    return galleryService.deleteAvatar(avatar);
  },

  putAvatarIntoMemberAndSave: async function putAvatarIntoMemberAndSave(member) {
    if (member.getAvatarData()) {
      return;
    }
    return updateImage(member);
  },

  updateImage,

  toWordList: function toWordList(members) {
    return wordList(members, (each) => each.toUpperCase());
  },

  toUngroupedWordList: function toUngroupedWordList(members) {
    return wordList(members, R.identity).sort((a, b) => a.text.localeCompare(b.text));
  },

  findMemberForAuthentication: function findMemberForAuthentication(user, authenticationId) {
    if (!user) {
      // not currently logged in
      return store.getMemberForAuthentication(authenticationId);
    }

    // logged in -> we don't care about the legacy id, we only want to add a new authentication provider to our profile
    const memberOfSession = user.member;
    const member = store.getMemberForAuthentication(authenticationId);
    if (member && memberOfSession.id() !== member.id()) {
      throw new Error("Unter dieser Authentifizierung existiert schon ein Mitglied.");
    }
    if (member && memberOfSession.id() === member.id()) {
      return member;
    }
    // no member found:
    memberOfSession.addAuthentication(authenticationId);
    store.saveMember(memberOfSession);
    return memberOfSession;
  },

  superuserEmails: function superuserEmails() {
    return store.superUsers().map((member) => member.email());
  },

  isReserved,
};
