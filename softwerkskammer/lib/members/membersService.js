const R = require("ramda");
const fs = require("fs");
const mimetypes = require("mime-types");

const beans = require("simple-configure").get("beans");
const store = beans.get("memberstore");
const avatarProvider = beans.get("avatarProvider");
const fieldHelpers = beans.get("fieldHelpers");
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

function setCustomAvatarImageInMember(member, callback) {
  return galleryService.retrieveScaledImage(member.customAvatar(), "mini", (err, result) => {
    if (err || !result) {
      if (err.message.match(/does not exist/)) {
        delete member.state.customAvatar;
      }
      return callback();
    }
    fs.readFile(result, function (err1, data) {
      member.setAvatarData({
        image: "data:" + mimetypes.lookup(result) + ";base64," + Buffer.from(data).toString("base64"),
        hasNoImage: false,
      });
      callback(err1);
    });
  });
}

function updateImage(member, callback) {
  // to be called at regular intervals
  if (member.hasCustomAvatar()) {
    return callback();
  }
  avatarProvider.getImage(member, async (imageData) => {
    member.setAvatarData(imageData);
    try {
      await store.saveMember(member);
      callback();
    } catch (e) {
      // never, ever "fork" stuff in node by not having return values *I AM IDIOT*
      callback(e);
    }
  });
}

module.exports = {
  isValidNickname: async function isValidNickname(nickname, callback) {
    if (fieldHelpers.containsSlash(nickname) || isReserved(nickname)) {
      return callback(null, false);
    }
    try {
      const result = await store.getMember(nickname);
      callback(null, !result);
    } catch (e) {
      return callback(e);
    }
  },

  isValidEmail: async function isValidEmail(email, callback) {
    try {
      const result = await store.getMemberForEMail(email);
      callback(null, !result);
    } catch (e) {
      return callback(e);
    }
  },

  saveCustomAvatarForNickname: async function saveCustomAvatarForNickname(nickname, files, params, callback) {
    try {
      const member = await store.getMember(nickname);
      galleryService.storeAvatar(files.image[0].path, params, (err1, filename) => {
        if (err1) {
          return callback(err1);
        }
        member.setCustomAvatar(filename);
        setCustomAvatarImageInMember(member, async () => {
          // we ignore the error here
          try {
            await store.saveMember(member);
            callback();
          } catch (e) {
            callback(e);
          }
        });
      });
    } catch (e) {
      return callback(e);
    }
  },

  deleteCustomAvatarForNickname: async function deleteCustomAvatarForNickname(nickname, callback) {
    try {
      const member = await store.getMember(nickname);
      if (!member.hasCustomAvatar()) {
        return callback();
      }
      const avatar = member.customAvatar();
      member.deleteCustomAvatar();
      await store.saveMember(member);
      galleryService.deleteAvatar(avatar, (err2) => {
        callback(err2);
      });
    } catch (e) {
      return callback(e);
    }
  },

  putAvatarIntoMemberAndSave: function putAvatarIntoMemberAndSave(member, callback) {
    if (member.getAvatarData()) {
      return callback();
    }
    updateImage(member, callback);
  },

  updateImage,

  toWordList: function toWordList(members) {
    return wordList(members, (each) => each.toUpperCase());
  },

  toUngroupedWordList: function toUngroupedWordList(members) {
    return wordList(members, R.identity).sort((a, b) => a.text.localeCompare(b.text));
  },

  findMemberFor: function findMemberFor(user, authenticationId, callback) {
    return async () => {
      if (!user) {
        // not currently logged in
        try {
          const member = await store.getMemberForAuthentication(authenticationId);
          return callback(null, member);
        } catch (e) {
          return callback(e);
        }
      }

      // logged in -> we don't care about the legacy id, we only want to add a new authentication provider to our profile
      const memberOfSession = user.member;
      try {
        const member = await store.getMemberForAuthentication(authenticationId);
        if (member && memberOfSession.id() !== member.id()) {
          return callback(new Error("Unter dieser Authentifizierung existiert schon ein Mitglied."));
        }
        if (member && memberOfSession.id() === member.id()) {
          return callback(null, member);
        }
        // no member found:
        memberOfSession.addAuthentication(authenticationId);
        try {
          await store.saveMember(memberOfSession);
          callback(null, memberOfSession);
        } catch (e) {
          callback(e, memberOfSession);
        }
      } catch (e) {
        return callback(e);
      }
    };
  },

  superuserEmails: async function superuserEmails(callback) {
    try {
      const members = await store.superUsers();
      callback(
        null,
        members.map((member) => member.email())
      );
    } catch (e) {
      callback(e);
    }
  },

  isReserved,
};
