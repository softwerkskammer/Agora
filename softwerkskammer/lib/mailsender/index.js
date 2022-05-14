const beans = require("simple-configure").get("beans");

const misc = beans.get("misc");
const validation = beans.get("validation");
const statusmessage = beans.get("statusmessage");
const mailsenderService = beans.get("mailsenderService");
const groupsAndMembersService = beans.get("groupsAndMembersService");
const groupstore = beans.get("groupstore");
const Message = beans.get("message");

function messageSubmitted(req, res, next) {
  if (req.body && req.body.massMailing && !res.locals.accessrights.isSuperuser()) {
    return res.redirect("/login");
  }

  const errors = validation.isValidMessage(req.body);
  if (errors.length !== 0) {
    return res.render("../../../views/errorPages/validationError", { errors });
  }

  const message = new Message(req.body, req.user.member);

  function processResult(err, statusmsg) {
    if (err) {
      return next(err);
    }
    statusmsg.putIntoSession(req);
    res.redirect(req.body.successURL);
  }

  if (req.body.massMailing === "members") {
    return mailsenderService.sendMailToAllMembers(message, processResult);
  }
  const activityURL = req.body.successURL.replace("/activities/", "");
  if (req.body.toParticipants) {
    message.removeAllButFirstButton();
    return mailsenderService.sendMailToParticipantsOf(activityURL, message, processResult);
  }
  if (req.body.invitedGroups) {
    return mailsenderService.sendMailToInvitedGroups(req.body.invitedGroups, activityURL, message, processResult);
  }
  if (req.body.groupName) {
    message.subject = `[${req.body.emailPrefix}] ${message.subject}`;
    return mailsenderService.sendMailToInvitedGroups([req.body.groupName], undefined, message, processResult);
  }
  if (req.body.nickname) {
    return mailsenderService.sendMailToMember(req.body.nickname, message, processResult);
  }
  if (req.body.groupNameForContact) {
    return mailsenderService.sendMailToContactPersonsOfGroup(req.body.groupNameForContact, message, processResult);
  }
  statusmessage
    .errorMessage("message.title.email_problem", "message.content.mailsender.error_no_recipient")
    .putIntoSession(req);
  res.redirect(req.body.successURL);
}

const app = misc.expressAppIn(__dirname);

app.get("/invitation/:activityUrl", (req, res, next) => {
  mailsenderService.dataForShowingMessageForActivity(req.params.activityUrl, req.session.language, (err, result) => {
    if (err) {
      return next(err);
    }
    if (!res.locals.accessrights.canEditActivity(result.activity)) {
      return res.redirect("/activities/" + encodeURIComponent(req.params.activityUrl));
    }
    res.render("compose", result);
  });
});

app.post("/", (req, res) => {
  res.render("compose", {});
});

app.get("/contactMember/:nickname", (req, res, next) => {
  mailsenderService.dataForShowingMessageToMember(req.params.nickname, (err, result) => {
    if (err || !result) {
      return next(err);
    }
    res.render("compose", result);
  });
});

app.get("/contactMembersOfGroup/:groupname", async (req, res) => {
  const groupName = req.params.groupname;
  try {
    const group = await groupstore.getGroup(groupName);
    if (!group.isMemberSubscribed(res.locals.accessrights.member()) && !res.locals.accessrights.isSuperuser()) {
      return res.redirect("/groups/" + encodeURIComponent(groupName));
    }
    return res.render("compose", {
      message: new Message(),
      successURL: "/groups/" + encodeURIComponent(groupName),
      groupName,
      emailPrefix: group.emailPrefix,
    });
  } catch (e) {
    return res.redirect("/groups/" + encodeURIComponent(groupName));
  }
});

app.get("/contactGroupContactPersons/:groupname", (req, res) => {
  const groupName = req.params.groupname;

  res.render("compose", {
    message: new Message(),
    successURL: "/groups/" + encodeURIComponent(groupName),
    contactPersons: {
      groupName: groupName,
    },
  });
});

app.post("/send", messageSubmitted);

app.get("/resign/:nickname", (req, res) => {
  res.render("compose-resign", { nickname: req.params.nickname });
});

app.post("/resign", async (req, res, next) => {
  const nickname = req.body.nickname;
  if (req.user.member.nickname() !== nickname) {
    return res.redirect("/members/" + encodeURIComponent(nickname));
  }
  try {
    await groupsAndMembersService.removeMember();
    const markdown =
      "**" +
      req.i18n.t("mailsender.why-resign") +
      "**\n" +
      req.body.why +
      "\n\n**" +
      req.i18n.t("mailsender.notes-resign") +
      "**\n" +
      req.body.notes;
    return mailsenderService.sendResignment(markdown, req.user.member, (err1) => {
      if (err1) {
        return next(err1);
      }
      statusmessage
        .successMessage("message.title.save_successful", "message.content.members.deleted")
        .putIntoSession(req);
      req.logout();
      res.redirect("/goodbye.html");
    });
  } catch (e) {
    if (e.message !== "hasSubscriptions") {
      throw e;
    }
    statusmessage.errorMessage("message.title.problem", "message.content.members.hasSubscriptions").putIntoSession(req);
    return res.redirect("/members/edit/" + encodeURIComponent(nickname));
  }
});

// API only for superusers, not visible in user interface
app.get("/massMailing", (req, res) => {
  const message = new Message();
  res.render("compose", { message, massMailing: true });
});

module.exports = app;
