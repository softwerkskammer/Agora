"use strict";
const R = require("ramda");
const Form = require("multiparty").Form;

const beans = require("simple-configure").get("beans");
const validation = beans.get("validation");
const Member = beans.get("member");
const Group = beans.get("group");
const membersService = beans.get("membersService");
const groupstore = beans.get("groupstore");
const memberstore = beans.get("memberstore");
const groupsAndMembersService = beans.get("groupsAndMembersService");
const groupsService = beans.get("groupsService");
const activitiesService = beans.get("activitiesService");
const wikiService = beans.get("wikiService");
const misc = beans.get("misc");
const statusmessage = beans.get("statusmessage");
const notifications = beans.get("notifications");
const authenticationService = beans.get("authenticationService");

function memberSubmitted(req, res) {
  function notifyNewMemberRegistration(member, subscriptions) {
    // must be done here, not in Service to avoid circular deps
    notifications.newMemberRegistered(member, subscriptions);
  }

  const nickname = groupsAndMembersService.updateAndSaveSubmittedMember(
    req.user,
    req.body,
    res.locals.accessrights,
    notifyNewMemberRegistration,
  );

  if (nickname) {
    statusmessage.successMessage("message.title.save_successful", "message.content.members.saved").putIntoSession(req);
    return res.redirect("/members/" + encodeURIComponent(nickname));
  }

  return res.redirect("/members");
}

function tagsFor() {
  const members = memberstore.allMembers();
  return membersService
    .toWordList(members)
    .map((wordlist) => wordlist.text)
    .sort();
}

const app = misc.expressAppIn(__dirname);

app.get("/", async (req, res) => {
  const members = memberstore.allMembers();
  await Promise.all(members.map((m) => membersService.putAvatarIntoMemberAndSave(m)));
  res.render("index", { members, wordList: membersService.toWordList(members) });
});

app.get("/interests", async (req, res) => {
  const casesensitive = req.query.casesensitive ? "" : "i";
  const members = memberstore.getMembersWithInterest(req.query.interest, casesensitive);
  await Promise.all(members.map(membersService.putAvatarIntoMemberAndSave));
  res.render("indexForTag", {
    interest: req.query.interest,
    members,
    wordList: membersService.toWordList(members),
  });
});

app.get("/checknickname", (req, res) => {
  const result = misc.validate(req.query.nickname, req.query.previousNickname, membersService.isValidNickname);
  res.end(result);
});

app.get("/checkemail", (req, res) => {
  const result = misc.validate(req.query.email, req.query.previousEmail, membersService.isValidEmail);
  res.end(result);
});

app.get("/new", (req, res) => {
  if (req.user.member) {
    return res.redirect("/members/");
  }
  const allGroups = groupstore.allGroups();
  res.render("edit", {
    member: new Member().initFromSessionUser(req.user),
    regionalgroups: groupsService.markGroupsSelected([], Group.regionalsFrom(allGroups)),
    themegroups: groupsService.markGroupsSelected([], Group.thematicsFrom(allGroups)),
    tags: tagsFor(),
  });
});

app.get("/edit/:nickname", (req, res, next) => {
  const allGroups = groupstore.allGroups();
  const member = groupsAndMembersService.getMemberWithHisGroups(req.params.nickname);

  if (!member) {
    return next();
  }
  if (!res.locals.accessrights.canEditMember(member)) {
    return res.redirect("/members/" + encodeURIComponent(member.nickname()));
  }
  res.render("edit", {
    member,
    regionalgroups: groupsService.markGroupsSelected(member.subscribedGroups, Group.regionalsFrom(allGroups)),
    themegroups: groupsService.markGroupsSelected(member.subscribedGroups, Group.thematicsFrom(allGroups)),
    tags: tagsFor(),
  });
});

app.get("/edit/", async (req, res) => {
  if (req.user && req.user.member) {
    res.redirect("/members/edit/" + encodeURIComponent(req.user.member.nickname()));
  }
});

app.post("/delete", (req, res) => {
  const nickname = req.body.nickname;
  if (!res.locals.accessrights.canDeleteMemberByNickname(nickname)) {
    return res.redirect("/members/" + encodeURIComponent(nickname));
  }
  try {
    groupsAndMembersService.removeMember(nickname);
    statusmessage
      .successMessage("message.title.save_successful", "message.content.members.deleted")
      .putIntoSession(req);
    res.redirect("/members/");
  } catch (e) {
    if (e.message !== "hasSubscriptions") {
      throw e;
    }
    statusmessage.errorMessage("message.title.problem", "message.content.members.hasSubscriptions").putIntoSession(req);
    return res.redirect("/members/edit/" + encodeURIComponent(nickname));
  }
});

app.post("/updatePassword", (req, res) => {
  const member = memberstore.getMemberForId(req.body.id);
  member.updatePassword(req.body.password);
  member.addAuthentication(authenticationService.pwdAuthenticationPrefix + member.email());
  memberstore.saveMember(member);
  res.redirect("/members/" + encodeURIComponent(member.nickname()));
});

app.post("/submit", (req, res, next) => {
  function checkNick() {
    try {
      const result = validation.checkValidity(
        req.body.previousNickname,
        req.body.nickname,
        membersService.isValidNickname,
      );
      if (!result) {
        return [req.i18n.t("validation.nickname_not_available")];
      }
      return [];
    } catch (e) {
      return [req.i18n.t("validation.nickname_not_available")];
    }
  }

  function checkMail() {
    try {
      const result = validation.checkValidity(req.body.previousEmail, req.body.email, membersService.isValidEmail);
      if (!result) {
        return [req.i18n.t("validation.duplicate_email")];
      }
      return [];
    } catch (e) {
      return [req.i18n.t("validation.duplicate_email")];
    }
  }
  const errorMessages = [checkNick(), checkMail(), validation.isValidForMember(req.body)];
  const realErrors = R.flatten(errorMessages).filter((message) => !!message);
  if (realErrors.length === 0) {
    return memberSubmitted(req, res, next);
  }
  return res.render("../../../views/errorPages/validationError", { errors: realErrors });
});

app.post("/submitavatar", async (req, res) => {
  const promisifyUpload = (req1) =>
    new Promise((resolve, reject) => {
      new Form().parse(req1, function (err, fields, files) {
        if (err) {
          return reject(err);
        }

        return resolve([fields, files]);
      });
    });

  try {
    const [fields, files] = await promisifyUpload(req);
    const nickname = fields.nickname[0];
    if (!files || files.length < 1) {
      return res.redirect("/members/" + nickname);
    }
    const params = {
      scale: parseFloat(fields.scale[0]),
      angle: parseFloat(fields.angle[0]),
      geometry: {
        width: parseInt(fields.w[0]),
        height: parseInt(fields.h[0]),
        left: parseInt(fields.x[0]),
        top: parseInt(fields.y[0]),
      },
    };
    await membersService.saveCustomAvatarForNickname(nickname, files, params);
    res.redirect("/members/" + encodeURIComponent(nickname)); // Es fehlen Prüfungen im Frontend
  } catch (e) {
    return res.redirect("/members/");
  }
});

app.post("/deleteAvatarFor", async (req, res) => {
  const nicknameOfEditMember = req.body.nickname;
  const member = memberstore.getMember(nicknameOfEditMember);
  if (res.locals.accessrights.canEditMember(member)) {
    await membersService.deleteCustomAvatarForNickname(nicknameOfEditMember);
    return res.redirect("/members/" + encodeURIComponent(nicknameOfEditMember));
  }
  res.redirect("/members/" + encodeURIComponent(nicknameOfEditMember));
});

app.get("/:nickname", async (req, res, next) => {
  const member = groupsAndMembersService.getMemberWithHisGroups(req.params.nickname);
  if (!member) {
    return next();
  }
  const subscribedGroups = member.subscribedGroups;
  const pastActivities = activitiesService.getPastActivitiesOfMember(member);
  const organizedOrEditedActivities = activitiesService.getOrganizedOrEditedActivitiesOfMember(member);
  const modifiedWikiFiles = await wikiService.listFilesModifiedByMember(member.nickname());
  res.render("get", {
    member,
    pastActivities,
    organizedOrEditedActivities,
    subscribedGroups,
    modifiedWikiFiles,
  });
});

module.exports = app;
