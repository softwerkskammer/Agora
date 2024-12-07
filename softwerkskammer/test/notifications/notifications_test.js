"use strict";

require("../../testutil/configureForTest");

const sinon = require("sinon").createSandbox();
const expect = require("must-dist");

const groupsAndMembersService = require("../../lib/groupsAndMembers/groupsAndMembersService");
const memberstore = require("../../lib/members/memberstore");

const Activity = require("../../lib/activities/activity");
const Member = require("../../lib/members/member");
const Group = require("../../lib/groups/group");
const notifications = require("../../lib/notifications");
const transport = require("../../lib/mailsender/mailtransport").transport;

let activity;
let activity2;
let group;
const hans = new Member({
  id: "hans",
  firstname: "firstname of hans",
  lastname: "lastname of hans",
  email: "hans@email.de",
  notifyOnWikiChanges: true,
});
const alice = new Member({
  id: "alice",
  firstname: "firstname of alice",
  lastname: "lastname of alice",
  email: "alice@email.de",
});
const bob = new Member({
  id: "bob",
  firstname: "firstname of bob",
  lastname: "lastname of bob",
  email: "bob@email.de",
  nickname: "nickbob",
});
const superuser = new Member({
  id: "superuserID",
  firstname: "firstname of superuser",
  lastname: "lastname of superuser",
  email: "superuser@email.de",
  nickname: "nicksuperuser",
});

describe("Notifications", () => {
  beforeEach(() => {
    group = new Group({ id: "groupname", longName: "Buxtehude" });
    activity = new Activity({ title: "Title of the Activity", assignedGroup: "groupname", url: "urlurl" });
    activity2 = new Activity({ title: "Another Nice Activity", assignedGroup: "groupname", url: "niceurl" });
    sinon.stub(groupsAndMembersService, "getGroupAndMembersForList").returns(group);
    sinon.stub(memberstore, "getMemberForId").callsFake((memberID) => {
      if (memberID === "hans") {
        return hans;
      }
      if (memberID === "alice") {
        return alice;
      }
      if (memberID === "bob") {
        return bob;
      }
      return null;
    });
    sinon.stub(memberstore, "allMembers").returns([hans, alice, bob, superuser]);
    sinon.stub(transport, "sendMail");
  });

  afterEach(() => {
    sinon.restore();
  });

  it("creates a meaningful text and subject", async () => {
    activity.state.owner = "hans";

    await notifications.visitorRegistration(activity, "bob");
    expect(transport.sendMail.calledOnce).to.be(true);
    const options = transport.sendMail.firstCall.args[0];
    expect(options.subject).to.equal("Neue Anmeldung für Aktivität");
    expect(options.html).to.contain(
      'Für die Aktivität "Title of the Activity" () hat sich ein neuer Besucher angemeldet:',
    );
    expect(options.html).to.contain("firstname of bob lastname of bob (nickbob)");
    expect(options.html).to.contain("/activities/urlurl");
  });

  it("creates a meaningful text and subject on each invocation when invoked twice", async () => {
    activity.state.owner = "hans";
    activity2.state.owner = "hans";

    await notifications.visitorRegistration(activity, "bob");
    await notifications.visitorRegistration(activity2, "alice");
    expect(transport.sendMail.calledTwice).to.be(true);
    let options = transport.sendMail.firstCall.args[0];
    expect(options.subject).to.equal("Neue Anmeldung für Aktivität");
    expect(options.html).to.contain(
      'Für die Aktivität "Title of the Activity" () hat sich ein neuer Besucher angemeldet:',
    );
    expect(options.html).to.contain("firstname of bob lastname of bob (nickbob)");
    expect(options.html).to.contain("/activities/urlurl");

    options = transport.sendMail.secondCall.args[0];
    expect(options.subject).to.equal("Neue Anmeldung für Aktivität");
    expect(options.html).to.contain(
      'Für die Aktivität "Another Nice Activity" () hat sich ein neuer Besucher angemeldet:',
    );
    expect(options.html).to.contain("firstname of alice lastname of alice ()");
    expect(options.html).to.contain("/activities/niceurl");
  });

  it("triggers mail sending for group organizers and activity owner", async () => {
    activity.state.owner = "hans";
    group.organizers = ["alice"];
    group.members = [hans, alice, bob];

    await notifications.visitorRegistration(activity, "bob");
    expect(transport.sendMail.calledOnce).to.be(true);
    const options = transport.sendMail.firstCall.args[0];
    expect(options.bcc).to.contain("hans@email.de");
    expect(options.bcc).to.contain("alice@email.de");
    expect(options.bcc).to.not.contain("bob");
    expect(options.from).to.contain("Softwerkskammer Benachrichtigungen");
  });

  it("triggers mail sending for only group organizers if activity has no owner", async () => {
    group.organizers = ["alice"];
    group.members = [hans, alice, bob];

    await notifications.visitorRegistration(activity, "bob");
    expect(transport.sendMail.calledOnce).to.be(true);
    const options = transport.sendMail.firstCall.args[0];
    expect(options.bcc).to.equal("alice@email.de");
    expect(options.bcc).to.not.contain("bob");
    expect(options.bcc).to.not.contain("hans");
  });

  it("does not trigger mail sending if activity has no owner and no group organizers", async () => {
    group.members = [hans, alice, bob];

    await notifications.visitorRegistration(activity, "bob");
    expect(transport.sendMail.called).to.be(false);
  });

  it("sorts directories in wikiChanges", async () => {
    const changes = [
      { dir: "A", sortedFiles: () => [] },
      { dir: "Z", sortedFiles: () => [] },
      { dir: "C", sortedFiles: () => [] },
    ];
    await notifications.wikiChanges(changes);
    const options = transport.sendMail.firstCall.args[0];
    expect(options.html).to.contain(
      '<h3>Wiki "A"</h3>\n    <hr>\n    <h3>Wiki "C"</h3>\n    <hr>\n    <h3>Wiki "Z"</h3>',
    );
  });

  it("unions superusers and wikisubscribers", async () => {
    const changes = [{ dir: "A", sortedFiles: () => [] }];
    await notifications.wikiChanges(changes);
    const options = transport.sendMail.firstCall.args[0];
    expect(options.bcc).to.contain("superuser");
    expect(options.bcc).to.contain("hans");
    expect(options.bcc).to.not.contain("alice");
    expect(options.bcc).to.not.contain("bob");
  });
});
