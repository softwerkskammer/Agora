"use strict";

const expect = require("must-dist");
const sinon = require("sinon").createSandbox();
const conf = require("../../testutil/configureForTest");
const beans = conf.get("beans");

const memberstore = beans.get("memberstore");
const groupstore = beans.get("groupstore");
const groupsService = beans.get("groupsService");
const groupsAndMembersService = beans.get("groupsAndMembersService");
const activitiesService = beans.get("activitiesService");
const activitystore = beans.get("activitystore");

const mailsenderService = beans.get("mailsenderService");
const Activity = beans.get("activity");
const Member = beans.get("member");
const Message = beans.get("message");
const Group = beans.get("group");
const fieldHelpers = beans.get("fieldHelpers");
const transport = beans.get("mailtransport").transport;

let emptyActivity;

const sender = new Member({
  firstname: "Agora",
  lastname: "User",
  email: "user@agora.local",
});
const mailSubject = "subject";
let message;
let sendmail;

function singleSentEmail() {
  expect(sendmail.calledOnce).to.be(true);
  return sendmail.args[0][0];
}

function allSentEmail() {
  return sendmail.args.map((callArgs) => callArgs[0]);
}

function expectNoEmailWasSent() {
  expect(sendmail.called).to.be.false();
}

describe("MailsenderService", () => {
  const activityURL = "acti_vi_ty";
  const nickname = "nickyNamy";

  beforeEach(() => {
    const availableGroups = [];
    message = new Message({ subject: mailSubject, markdown: "mark down" }, sender);
    emptyActivity = new Activity({
      title: "Title of the Activity",
      description: "description1",
      assignedGroup: "assignedGroup",
      location: "location1",
      direction: "direction1",
      startDate: fieldHelpers.parseToDateTimeUsingDefaultTimezone("01.01.2013").toJSDate(),
      url: "urlOfTheActivity",
    });
    sinon.stub(groupstore, "allGroups").returns(availableGroups);
    sinon.stub(activitiesService, "getActivityWithGroupAndParticipants").callsFake((actURL) => {
      if (actURL === null) {
        throw new Error();
      }
      return emptyActivity;
    });
    sinon.stub(memberstore, "getMember").callsFake((nick) => {
      if (nick === null) {
        return null;
      }
      if (nick === "broken") {
        return new Error();
      }
      return new Member({ email: "email@mail.de" });
    });
    sinon.stub(activitystore, "getActivity").callsFake((url) => {
      if (url === "activityUrlForMock") {
        return emptyActivity;
      }
      throw new Error();
    });
    sendmail = sinon.stub(transport, "sendMail").callsFake((transportobject) => {
      if (!transportobject.to && (!transportobject.bcc || transportobject.bcc.length === 0)) {
        // simulating the behaviour of nodemailer
        throw new Error();
      }
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("preparing data", () => {
    it("for showing the edit form for an activity", async () => {
      const result = await mailsenderService.dataForShowingMessageForActivity(activityURL, "de");
      expect(result.message).to.exist();
      expect(result.regionalgroups).to.exist();
      expect(result.themegroups).to.exist();
      expect(result.successURL).to.contain(activityURL);
    });

    it("URIescapes the url for an activity", async () => {
      const url = "some%20thing";
      const encodedURL = encodeURIComponent(url);
      const result = await mailsenderService.dataForShowingMessageForActivity(url, "de");
      expect(result.successURL).to.contain(encodedURL);
    });

    it("for showing the edit form for a member", async () => {
      const result = await mailsenderService.dataForShowingMessageToMember(nickname);
      expect(result.message).to.exist();
      expect(result.regionalgroups).not.to.exist();
      expect(result.themegroups).not.to.exist();
      expect(result.successURL).to.contain(nickname);
    });

    it("URIescapes the nickname for a member", async () => {
      const nick = "some%20thing";
      const encodedNick = encodeURIComponent(nick);
      const result = await mailsenderService.dataForShowingMessageToMember(nick);
      expect(result.successURL).to.contain(encodedNick);
    });
  });

  describe("activity markdown", () => {
    it("with direction", () => {
      const activity = new Activity().fillFromUI({
        url: "url",
        description: "description",
        location: "location",
        direction: "direction",
        startDate: "4.5.2013",
        startTime: "12:21",
      });
      const markdown = mailsenderService.activityMarkdown(activity);
      expect(markdown).to.contain("description");
      expect(markdown).to.contain("4. Mai 2013");
      expect(markdown).to.contain("12:21");
      expect(markdown).to.contain("location");
      expect(markdown).to.contain("Wegbeschreibung");
      expect(markdown).to.contain("direction");
    });

    it("without direction", () => {
      const activity = new Activity({
        url: "url",
        description: "description",
        location: "location",
        direction: "",
        startDate: "4.5.2013",
        startTime: "12:21",
      });
      expect(mailsenderService.activityMarkdown(activity)).to.not.contain("Wegbeschreibung");
    });
  });

  describe("sending mail as reminder for activity", () => {
    it("sends to participants", async () => {
      const email = "emailAddress@e.mail";
      emptyActivity.participants = [new Member({ email })];

      const statusmessage = await mailsenderService.sendMailToParticipantsOf(activityURL, message);
      const sentEmail = singleSentEmail();
      expect(sentEmail.bcc).to.contain(email);
      expect(sentEmail.html).to.contain("mark down");
      expect(sentEmail.icalEvent).to.contain("BEGIN:VCALENDAR");
      expect(sentEmail.icalEvent).to.contain("URL:http://localhost:17125/activities/urlOfTheActivity");
      expect(statusmessage.contents().type).to.equal("alert-success");
    });

    it("does not send mail if no participants", async () => {
      const statusmessage = await mailsenderService.sendMailToParticipantsOf(activityURL, message);
      expect(sendmail.calledOnce).to.be(true);
      expect(statusmessage.contents().type).to.equal("alert-danger");
    });

    it("does not send mail if activity canot be found", async () => {
      const statusmessage = await mailsenderService.sendMailToParticipantsOf(null, message);
      expect(sendmail.calledOnce).to.not.be(true);
      expect(statusmessage.contents().type).to.equal("alert-danger");
    });
  });

  describe("sending mail to distinct member", () => {
    it("sends the email", async () => {
      const statusmessage = await mailsenderService.sendMailToMember("nickname", message);
      const sentMail = singleSentEmail();
      expect(sentMail.bcc).to.contain("email@mail.de");
      expect(sentMail.html).to.contain("mark down");
      expect(statusmessage.contents().type).to.equal("alert-success");
    });

    it("does not send the email if member cannot be found", async () => {
      const statusmessage = await mailsenderService.sendMailToMember(null, message);
      expect(statusmessage.contents().type).to.equal("alert-danger");
    });

    it("does not send the email if finding member causes error", async () => {
      const statusmessage = await mailsenderService.sendMailToMember("broken", message);
      expect(statusmessage.contents().type).to.equal("alert-danger");
    });
  });

  describe("sending resignment mail", () => {
    const superuser = new Member({ id: "superuserID", email: "email@super.user" });

    beforeEach(() => {
      sinon.stub(memberstore, "superUsers").returns([superuser]);
    });

    it("sends the email", async () => {
      const markdown = "";
      const member = new Member({ nickname: "nick", firstname: "first", lastname: "last" });
      const statusmessage = await mailsenderService.sendResignment(markdown, member);
      const sentMail = singleSentEmail();
      expect(sentMail.from).to.contain("first last");
      expect(sentMail.subject).to.contain("Austrittswunsch");
      expect(sentMail.to).to.contain("email@super.user");
      expect(statusmessage.contents().type).to.equal("alert-success");
    });

    it("does not send the email if member cannot be found", async () => {
      const statusmessage = await mailsenderService.sendMailToMember(null, message);
      expect(statusmessage.contents().type).to.equal("alert-danger");
    });

    it("does not send the email if finding member causes error", async () => {
      const statusmessage = await mailsenderService.sendMailToMember("broken", message);
      expect(statusmessage.contents().type).to.equal("alert-danger");
    });
  });

  describe("sending mail to a group's members", () => {
    const groupA = new Group({ id: "groupA" });

    beforeEach(() => {
      sinon.stub(groupsService, "getGroups").callsFake((groupnames) => {
        if (groupnames === null) {
          throw new Error();
        }
        if (groupnames.length === 0) {
          return [];
        }
        return [groupA];
      });
    });

    it("sends to members of selected groups", async () => {
      sinon.stub(groupsAndMembersService, "addMembersToGroup").callsFake((group) => {
        if (group === null) {
          return null;
        }
        if (group === groupA) {
          group.members = [new Member({ email: "memberA" })];
        }
        return group;
      });
      const statusmessage = await mailsenderService.sendMailToInvitedGroups(["GroupA"], undefined, message, sender);
      const sentMail = singleSentEmail();
      expect(sentMail.bcc).to.contain("memberA");
      expect(sentMail.html).to.contain("mark down");
      expect(sentMail.icalEvent).to.not.contain("BEGIN:VCALENDAR");
      expect(sentMail.icalEvent).to.not.contain("URL:http://localhost:17125/activities/urlOfTheActivity");
      expect(statusmessage.contents().type).to.equal("alert-success");
    });

    describe("sending in chunks", () => {
      let membersAboveSingleChunkThreshhold = [
        new Member({ email: "memberA" }),
        new Member({ email: "memberB" }),
        new Member({ email: "memberC" }),
        new Member({ email: "memberD" }),
        new Member({ email: "memberE" }),
        new Member({ email: "memberF" }),
      ];

      it("sends in chunks to members of selected groups when above configured threshold", async () => {
        sinon.stub(groupsAndMembersService, "addMembersToGroup").callsFake((group) => {
          group.members = membersAboveSingleChunkThreshhold;
        });
        const statusmessage = await mailsenderService.sendMailToInvitedGroups(["GroupA"], undefined, message, sender);
        const allSent = allSentEmail();
        const sentMail1 = allSent[0];
        expect(sentMail1.bcc).to.eql(["memberA", "memberB", "memberC", "memberD", "memberE"]);
        const sentMail2 = allSent[1];
        expect(sentMail2.bcc).to.eql(["memberF"]);

        expect(statusmessage.contents().type).to.equal("alert-success");
      });

      it("sends status mail to intiator after all mails have been sent", async () => {
        let mailsSentCount = 0;
        let myResolve;
        const allExpectedMailsSent = new Promise((resolve) => {
          myResolve = resolve;
        });
        sendmail.reset();
        sendmail.callsFake(() => {
          mailsSentCount++;

          if (mailsSentCount >= 3) {
            myResolve(undefined);
          }
        });
        sinon.stub(groupsAndMembersService, "addMembersToGroup").callsFake((group) => {
          group.members = membersAboveSingleChunkThreshhold;
          return group;
        });

        let statusmessage = await mailsenderService.sendMailToInvitedGroups(["GroupA"], undefined, message, sender);

        expect(statusmessage.contents().type).to.equal("alert-success");
        expect(statusmessage.contents().text).to.equal("message.content.mailsender.success");

        await allExpectedMailsSent;
        const allSent = allSentEmail();

        expect(allSent).to.have.length(3);

        expect(allSent[2].to).to.equal(sender.email());
        expect(allSent[2].subject).to.contain("Report");
        expect(allSent[2].subject).to.contain(mailSubject);
        expect(allSent[2].html).to.contain("erfolgreich");
      });

      it("returns success regardless of mail sending result", async () => {
        sendmail.callsFake(() => {
          throw new Error();
        });
        sinon.stub(groupsAndMembersService, "addMembersToGroup").callsFake((group) => {
          group.members = membersAboveSingleChunkThreshhold;
        });

        const statusmessage = await mailsenderService.sendMailToInvitedGroups(["GroupA"], undefined, message, sender);

        expect(statusmessage.contents().type).to.equal("alert-success");
      });

      it("includes errors in send report mail from Error", async () => {
        let mailsSentCount = 0;
        let myResolve;
        const allExpectedMailsSent = new Promise((resolve) => {
          myResolve = resolve;
        });
        sendmail.reset();
        sendmail.callsFake(() => {
          mailsSentCount++;

          if (mailsSentCount >= 3) {
            myResolve(undefined);
          } else {
            throw new Error("Error: das hat nicht geklappt");
          }
        });
        sinon.stub(groupsAndMembersService, "addMembersToGroup").callsFake((group) => {
          group.members = membersAboveSingleChunkThreshhold;
        });

        await mailsenderService.sendMailToInvitedGroups(["GroupA"], undefined, message, sender);

        await allExpectedMailsSent;

        const sentEmails = allSentEmail();
        expect(sentEmails).to.have.length(3);
        expect(sentEmails[2].to).to.contain(sender.email());
        expect(sentEmails[2].subject).to.contain("Report");
        expect(sentEmails[2].subject).to.contain(mailSubject);
        expect(sentEmails[2].html).to.contain("Fehler");
        expect(sentEmails[2].html).to.contain("Error: das hat nicht geklappt");
      });

      it("includes errors in send report mail from Promise rejection", async () => {
        let mailsSentCount = 0;
        let myResolve;
        const allExpectedMailsSent = new Promise((resolve) => {
          myResolve = resolve;
        });
        sendmail.reset();
        sendmail.callsFake(() => {
          mailsSentCount++;

          if (mailsSentCount >= 3) {
            myResolve(undefined);
          } else {
            return Promise.reject("Promise: das hat nicht geklappt");
          }
        });
        sinon.stub(groupsAndMembersService, "addMembersToGroup").callsFake((group) => {
          group.members = membersAboveSingleChunkThreshhold;
        });

        await mailsenderService.sendMailToInvitedGroups(["GroupA"], undefined, message, sender);

        await allExpectedMailsSent;

        const sentEmails = allSentEmail();
        expect(sentEmails).to.have.length(3);
        expect(sentEmails[2].to).to.contain(sender.email());
        expect(sentEmails[2].subject).to.contain("Report");
        expect(sentEmails[2].subject).to.contain(mailSubject);
        expect(sentEmails[2].html).to.contain("Fehler");
        expect(sentEmails[2].html).to.contain("Promise: das hat nicht geklappt");
      });
    });
  });

  describe("sending mail as invitation for activity ", () => {
    const groupA = new Group({ id: "groupA" });
    const groupB = new Group({ id: "groupB" });

    beforeEach(() => {
      sinon.stub(groupsService, "getGroups").callsFake((groupnames) => {
        if (groupnames === null) {
          throw new Error();
        }
        if (groupnames.length === 0) {
          return [];
        }
        return [groupA, groupB];
      });
    });

    it("sends to members of selected groups", async () => {
      sinon.stub(groupsAndMembersService, "addMembersToGroup").callsFake((group) => {
        if (group === null) {
          return null;
        }
        if (group === groupA) {
          group.members = [new Member({ email: "memberA" })];
        }
        if (group === groupB) {
          group.members = [new Member({ email: "memberB" })];
        }
        return group;
      });
      const statusmessage = await mailsenderService.sendMailToInvitedGroups(
        ["GroupA", "GroupB"],
        "activityUrlForMock",
        message,
        sender,
      );
      const sentMail = singleSentEmail();
      expect(sentMail.bcc).to.contain("memberA");
      expect(sentMail.bcc).to.contain("memberB");
      expect(sentMail.html).to.contain("mark down");
      expect(sentMail.icalEvent).to.contain("BEGIN:VCALENDAR");
      expect(sentMail.icalEvent).to.contain("URL:http://localhost:17125/activities/urlOfTheActivity");
      expect(statusmessage.contents().type).to.equal("alert-success");
    });

    it("ignores errors finding the activity when sending to members of selected groups", async () => {
      sinon.stub(groupsAndMembersService, "addMembersToGroup").callsFake((group) => {
        if (group === null) {
          return null;
        }
        if (group === groupA) {
          group.members = [new Member({ email: "memberA" })];
        }
        if (group === groupB) {
          group.members = [new Member({ email: "memberB" })];
        }
        return group;
      });
      const statusmessage = await mailsenderService.sendMailToInvitedGroups(
        ["GroupA", "GroupB"],
        "errorProvokingUrl",
        message,
        sender,
      );
      const sentMail = singleSentEmail();
      expect(sentMail.bcc).to.contain("memberA");
      expect(sentMail.bcc).to.contain("memberB");
      expect(sentMail.html).to.contain("mark down");
      expect(sentMail.icalEvent).to.be(undefined);
      expect(statusmessage.contents().type).to.equal("alert-success");
    });

    it("does not send to members if no groups selected", async () => {
      const statusmessage = await mailsenderService.sendMailToInvitedGroups([], "activityUrlForMock", message, sender);
      expect(sendmail.calledOnce).to.not.be(true);
      expect(statusmessage.contents().type).to.equal("alert-danger");
    });

    it("does not send to members if finding groups causes error", async () => {
      const statusmessage = await mailsenderService.sendMailToInvitedGroups(
        null,
        "activityUrlForMock",
        message,
        sender,
      );
      expect(sendmail.calledOnce).to.not.be(true);
      expect(statusmessage.contents().type).to.equal("alert-danger");
    });

    it("does not send to members if filling groups with members causes error", async () => {
      sinon.stub(groupsAndMembersService, "addMembersToGroup").throws(new Error());

      const statusmessage = await mailsenderService.sendMailToInvitedGroups(
        ["GroupA", "GroupB"],
        "activityUrlForMock",
        message,
        sender,
      );
      expect(sendmail.calledOnce).to.not.be(true);
      expect(statusmessage.contents().type).to.equal("alert-danger");
    });
  });

  describe("sending to contact persons of a group", () => {
    function getGroups(groupIdToLookUp, fakeImplementation) {
      return sinon.stub(groupsService, "getGroups").callsFake(fakeImplementation);
    }

    function thereIsAGroup(group) {
      return getGroups(group.id, function () {
        return [group];
      });
    }

    function thereIsNoGroup() {
      return sinon.stub(groupsService, "getGroups").returns([]);
    }

    function getGroupFails(groupId) {
      return getGroups(groupId, function () {
        throw new Error("getGroups failed");
      });
    }

    function loadingGroupOrganizersFailsFor() {
      return sinon.stub(groupsAndMembersService, "getOrganizersOfGroup").throws(new Error("no soup for you"));
    }

    const anyMemberWithEmail = new Member({
      email: "any@example.org",
    });

    function groupIsOrganizedBy(groupName, organizers) {
      return sinon.stub(groupsAndMembersService, "getOrganizersOfGroup").returns(organizers);
    }

    function provideValidOrganizersForGroup(groupName) {
      groupIsOrganizedBy(groupName, [anyMemberWithEmail]);
    }

    const groupId = "any-group-id";

    describe("when contact organizers is disabled for group", () => {
      it("does not send any mail", async () => {
        const group = new Group({ id: groupId, contactingOrganizersEnabled: false });
        thereIsAGroup(group);
        provideValidOrganizersForGroup(groupId);

        const statusMessage = await mailsenderService.sendMailToContactPersonsOfGroup(groupId, message);
        expectNoEmailWasSent();
        expect(statusMessage.contents().type).to.eql("alert-danger");
        expect(statusMessage.contents().additionalArguments.type).to.eql("$t(mailsender.notification)");
        expect(statusMessage.contents().additionalArguments.err).to.eql(
          "$t(mailsender.contact_the_organizers_disabled)",
        );
      });
    });

    describe("when getting group fails", () => {
      it("does not send any mail to the organizers", async () => {
        getGroupFails(groupId);
        groupIsOrganizedBy(groupId, [anyMemberWithEmail]);

        const statusMessage = await mailsenderService.sendMailToContactPersonsOfGroup(groupId, message);
        expectNoEmailWasSent();

        expect(statusMessage.contents().type).to.eql("alert-danger");
        expect(statusMessage.contents().additionalArguments.type).to.eql("$t(mailsender.notification)");
        expect(statusMessage.contents().additionalArguments.err).to.eql("Error: getGroups failed");
      });
    });

    describe("when group does not exist", () => {
      it("does not send any mail to the organizers", async () => {
        thereIsNoGroup();
        groupIsOrganizedBy(groupId, [anyMemberWithEmail]);

        const statusMessage = await mailsenderService.sendMailToContactPersonsOfGroup(groupId, message);
        expectNoEmailWasSent();

        expect(statusMessage.contents().type).to.eql("alert-danger");
        expect(statusMessage.contents().additionalArguments.type).to.eql("$t(mailsender.notification)");
        expect(statusMessage.contents().additionalArguments.err).to.eql(
          "Error: Das senden der E-Mail ist fehlgeschlagen. Es liegt ein technisches Problem vor.",
        );
      });
    });

    describe("when contact organizers is enabled for group", () => {
      const organizerId1 = "first";
      const organizerId2 = "second";
      const group = new Group({
        id: groupId,
        contactingOrganizersEnabled: true,
        organizers: [organizerId1, organizerId2],
      });

      beforeEach(() => {
        thereIsAGroup(group);
      });

      it("sends BCC to all organizers of given group", async () => {
        groupIsOrganizedBy(groupId, [
          new Member({
            id: organizerId1,
            email: "first@example.org",
          }),
          new Member({
            id: organizerId2,
            email: "second@example.org",
          }),
        ]);

        await mailsenderService.sendMailToContactPersonsOfGroup(groupId, message);
        const sentMail = singleSentEmail();
        expect(sentMail.bcc).to.contain("first@example.org");
        expect(sentMail.bcc).to.contain("second@example.org");
      });

      it("allows organizers to see the source of the mail by prepending a prefix to the subject", async () => {
        groupIsOrganizedBy(groupId, [anyMemberWithEmail]);

        message.setSubject("Email-Subject");

        await mailsenderService.sendMailToContactPersonsOfGroup(groupId, message);
        const sentMail = singleSentEmail();
        expect(sentMail.subject).to.eql("[Anfrage an Ansprechpartner/Mail to organizers] Email-Subject");
      });

      describe("organizers for group can not be read", () => {
        it("does not send any email", async () => {
          loadingGroupOrganizersFailsFor(groupId);

          const statusMessage = await mailsenderService.sendMailToContactPersonsOfGroup(groupId, message);
          expectNoEmailWasSent();
          expect(statusMessage.contents().type).to.eql("alert-danger");
          expect(statusMessage.contents().additionalArguments.type).to.eql("$t(mailsender.notification)");
          expect(statusMessage.contents().additionalArguments.err).to.eql("Error: no soup for you");
        });
      });

      describe("in case of a group without any organizers", () => {
        it("does not send any email", async () => {
          groupIsOrganizedBy(groupId, []);

          const statusMessage = await mailsenderService.sendMailToContactPersonsOfGroup(groupId, message);
          expectNoEmailWasSent();
          expect(statusMessage.contents().type).to.eql("alert-danger");
          expect(statusMessage.contents().additionalArguments.err).to.eql("$t(mailsender.group_has_no_organizers)");
          expect(statusMessage.contents().additionalArguments.type).to.eql("$t(mailsender.notification)");
        });
      });

      it("returns a message indicating the success when message is successfully send", async () => {
        groupIsOrganizedBy(groupId, [anyMemberWithEmail]);
        const statusMessage = await mailsenderService.sendMailToContactPersonsOfGroup(groupId, message);
        expect(statusMessage.contents().type).to.eql("alert-success");
      });
    });
  });

  describe("sending to all members", () => {
    const member1 = new Member({ email: "memberA" });
    const member2 = new Member({ email: "memberB" });

    beforeEach(() => {
      sinon.stub(memberstore, "allMembers").callsFake(() => {
        return [member1, member2];
      });
    });

    it("sends in chunks to all members", async () => {
      const statusmessage = await mailsenderService.sendMailToAllMembers(message, sender);
      const allSent = allSentEmail();
      const sentMail1 = allSent[0];
      expect(sentMail1.bcc).to.eql(["memberA", "memberB"]);

      expect(statusmessage.contents().type).to.equal("alert-success");
    });

    it("sends status mail to intiator after all mails have been sent", async () => {
      let mailsSentCount = 0;
      let myResolve;
      const allExpectedMailsSent = new Promise((resolve) => {
        myResolve = resolve;
      });
      sendmail.reset();
      sendmail.callsFake(() => {
        mailsSentCount++;

        if (mailsSentCount >= 2) {
          myResolve(undefined);
        }
      });

      let statusmessage = await mailsenderService.sendMailToAllMembers(message, sender);

      expect(statusmessage.contents().type).to.equal("alert-success");
      expect(statusmessage.contents().text).to.equal("message.content.mailsender.success");

      await allExpectedMailsSent;
      const allSent = allSentEmail();

      expect(allSent).to.have.length(2);

      expect(allSent[1].to).to.equal(sender.email());
      expect(allSent[1].subject).to.contain("Report");
      expect(allSent[1].subject).to.contain(mailSubject);
      expect(allSent[1].html).to.contain("erfolgreich");
    });

    it("returns success regardless of mail sending result", async () => {
      sendmail.callsFake(() => {
        throw new Error();
      });

      const statusmessage = await mailsenderService.sendMailToAllMembers(message, sender);

      expect(statusmessage.contents().type).to.equal("alert-success");
    });

    it("includes errors in send report mail from Error", async () => {
      let mailsSentCount = 0;
      let myResolve;
      const allExpectedMailsSent = new Promise((resolve) => {
        myResolve = resolve;
      });
      sendmail.reset();
      sendmail.callsFake(() => {
        mailsSentCount++;

        if (mailsSentCount >= 2) {
          myResolve(undefined);
        } else {
          throw new Error("Error: das hat nicht geklappt");
        }
      });

      await mailsenderService.sendMailToAllMembers(message, sender);

      await allExpectedMailsSent;

      const sentEmails = allSentEmail();
      expect(sentEmails).to.have.length(2);
      expect(sentEmails[1].to).to.contain(sender.email());
      expect(sentEmails[1].subject).to.contain("Report");
      expect(sentEmails[1].subject).to.contain(mailSubject);
      expect(sentEmails[1].html).to.contain("Fehler");
      expect(sentEmails[1].html).to.contain("Error: das hat nicht geklappt");
    });

    it("includes errors in send report mail from Promise rejection", async () => {
      let mailsSentCount = 0;
      let myResolve;
      const allExpectedMailsSent = new Promise((resolve) => {
        myResolve = resolve;
      });
      sendmail.reset();
      sendmail.callsFake(() => {
        mailsSentCount++;

        if (mailsSentCount >= 2) {
          myResolve(undefined);
        } else {
          return Promise.reject("Promise: das hat nicht geklappt");
        }
      });
      sinon.stub(groupsAndMembersService, "addMembersToGroup").callsFake((group) => {
        group.members = membersAboveSingleChunkThreshhold;
      });

      await mailsenderService.sendMailToAllMembers(message, sender);

      await allExpectedMailsSent;

      const sentEmails = allSentEmail();
      expect(sentEmails).to.have.length(2);
      expect(sentEmails[1].to).to.contain(sender.email());
      expect(sentEmails[1].subject).to.contain("Report");
      expect(sentEmails[1].subject).to.contain(mailSubject);
      expect(sentEmails[1].html).to.contain("Fehler");
      expect(sentEmails[1].html).to.contain("Promise: das hat nicht geklappt");
    });
  });
});
