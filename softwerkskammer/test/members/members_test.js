"use strict";

const request = require("supertest");
const sinon = require("sinon").createSandbox();
const expect = require("must-dist");

const beans = require("../../testutil/configureForTest").get("beans");
const Member = beans.get("member");
const membersService = beans.get("membersService");
const memberstore = beans.get("memberstore");
const groupstore = beans.get("groupstore");
const groupsService = beans.get("groupsService");
const groupsAndMembersService = beans.get("groupsAndMembersService");
const wikiService = beans.get("wikiService");
const activitiesService = beans.get("activitiesService");
const notifications = beans.get("notifications");
let dummymember;

const createApp = require("../../testutil/testHelper")("membersApp").createApp;
const app = createApp();

let allMembers;
let getMember;
let getSubscribedGroupsForUser;

describe("Members application", () => {
  beforeEach(() => {
    dummymember = new Member({
      id: "memberID",
      nickname: "hada",
      email: "a@b.c",
      site: "http://my.blog",
      firstname: "Hans",
      lastname: "Dampf",
      authentications: [],
    });
    allMembers = sinon.stub(memberstore, "allMembers").callsFake((callback) => {
      callback(null, [dummymember]);
    });
    getMember = sinon.stub(memberstore, "getMember").callsFake((nickname, callback) => {
      callback(null, dummymember);
    });
    sinon.stub(membersService, "putAvatarIntoMemberAndSave").callsFake((member, callback) => {
      callback();
    });
    getSubscribedGroupsForUser = sinon.stub(groupsService, "getSubscribedGroupsForMember").returns([]);
    sinon.stub(activitiesService, "getPastActivitiesOfMember").callsFake((member, callback) => {
      callback(null, []);
    });
    sinon.stub(activitiesService, "getOrganizedOrEditedActivitiesOfMember").callsFake((member, callback) => {
      callback(null, []);
    });
    sinon.stub(groupstore, "allGroups").returns([]);
    sinon.stub(wikiService, "listFilesModifiedByMember").callsFake((nickname, callback) => {
      callback(null, []);
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("shows the list of members as retrieved from the membersstore if the user is registered", (done) => {
    request(createApp({ id: "hada" }))
      .get("/")
      .expect(200)
      .expect(/href="\/members\/hada"/)
      .expect(/Hans Dampf/, (err) => {
        expect(allMembers.calledOnce).to.be(true);
        done(err);
      });
  });

  it("shows the details of one member as retrieved from the membersstore", (done) => {
    request(createApp({ id: "hada" }))
      .get("/hada")
      .expect(200)
      .expect(/http:\/\/my\.blog/, (err) => {
        expect(getMember.calledWith(dummymember.nickname())).to.be(true);
        expect(getSubscribedGroupsForUser.calledWith(dummymember)).to.be(true);
        done(err);
      });
  });

  it("allows a member to edit her own data", (done) => {
    request(createApp({ id: "memberID" }))
      .get("/edit/hada")
      .expect(200)
      .expect(/Profil bearbeiten/, done);
  });

  it("does not allow a member to edit another member's data", (done) => {
    request(createApp({ id: "memberID1" }))
      .get("/edit/hada")
      .expect(302)
      .expect("location", /members/, done);
  });

  it("allows a superuser member to edit another member's data", (done) => {
    request(createApp({ id: "superuserID" }))
      .get("/edit/hada")
      .expect(200, done);
  });

  it("allows a member to edit her own avatar", (done) => {
    request(createApp({ id: "memberID" }))
      .get("/hada")
      .expect(200)
      .expect(/<img src="https:\/\/www\.gravatar\.com\/avatar\/5d60d4e28066df254d5452f92c910092\?d=mm&amp;s=200"/)
      .expect(/<input id="input-file" type="file" accept="image\/\*" name="image"\/>/, done);
  });

  it("does not allow a member to edit another member's avatar", (done) => {
    request(createApp({ id: "memberID1" }))
      .get("/hada")
      .expect(200)
      .expect(
        /<img src="https:\/\/www\.gravatar\.com\/avatar\/5d60d4e28066df254d5452f92c910092\?d=mm&amp;s=200"/,
        (err, res) => {
          expect(res.text).to.not.contain('<input id="input-file" type="file" accept="image/*" name="image"');
          done(err);
        }
      );
  });

  it("allows a superuser member to edit another member's avatar", (done) => {
    request(createApp({ id: "superuserID" }))
      .get("/hada")
      .expect(200)
      .expect(/<input id="input-file" type="file" accept="image\/\*" name="image"\/>/, done);
  });

  it("allows a superuser member to add another member's authentication", (done) => {
    request(createApp({ id: "superuserID" }))
      .get("/edit/hada")
      .expect(200)
      .expect(/<input class="form-control trim-text" id="additionalAuthentication" type="text"/, done);
  });

  it("does not allow a member to add another authentication to her own profile", (done) => {
    request(createApp({ id: "memberID" }))
      .get("/edit/hada")
      .expect(200, (err, res) => {
        expect(res.text).to.not.contain('<input class="form-control" id="additionalAuthentication" type="text"');
        done(err);
      });
  });

  it("rejects a member with invalid and different nickname on submit", (done) => {
    sinon.stub(membersService, "isValidNickname").callsFake((nickname, callback) => {
      callback(null, false);
    });

    request(app)
      .post("/submit")
      .send("id=0815&firstname=A&lastname=B&email=c@d.de&previousEmail=c@d.de&location=x&profession=y&reference=z")
      .send("nickname=nickerinack")
      .send("previousNickname=bibabu")
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Dieser Nickname ist leider nicht verfügbar\./, done);
  });

  it("rejects a member with invalid and different email address on submit", (done) => {
    sinon.stub(membersService, "isValidEmail").callsFake((nickname, callback) => {
      callback(null, false);
    });

    request(app)
      .post("/submit")
      .send("id=0815&firstname=A&lastname=B&nickname=nuck&previousNickname=nuck&location=x&profession=y&reference=z")
      .send("email=here@there.org")
      .send("previousEmail=there@wherever.com")
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Diese Adresse ist schon registriert\. Hast Du bereits ein Profil angelegt?/, done);
  });

  it("rejects a member with missing first and last name on submit", (done) => {
    request(app)
      .post("/submit")
      .send(
        "id=0815&&nickname=nuck&previousNickname=nuck&location=x&profession=y&reference=z&email=here@there.org&previousEmail=here@there.org"
      )
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Vorname ist ein Pflichtfeld\./)
      .expect(/Nachname ist ein Pflichtfeld\./, done);
  });

  it("rejects a member with missing first name who validly changed their nickname and mailaddress on submit", (done) => {
    // attention: This combination is required to prove the invocations of the callbacks in case of no error!
    sinon.stub(membersService, "isValidNickname").callsFake((nickname, callback) => {
      callback(null, true);
    });
    sinon.stub(membersService, "isValidEmail").callsFake((nickname, callback) => {
      callback(null, true);
    });

    request(app)
      .post("/submit")
      .send(
        "id=0815&&nickname=nuckNew&previousNickname=nuck&lastname=x&location=x&profession=y&reference=z&email=hereNew@there.org&previousEmail=here@there.org"
      )
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Vorname ist ein Pflichtfeld\./, done);
  });

  it("rejects a member with invalid nickname and email address on submit, giving two error messages", (done) => {
    sinon.stub(membersService, "isValidNickname").callsFake((nickname, callback) => {
      callback(null, false);
    });
    sinon.stub(membersService, "isValidEmail").callsFake((nickname, callback) => {
      callback(null, false);
    });

    request(app)
      .post("/submit")
      .send("id=0815&firstname=A&lastname=B&location=x&profession=y&reference=z")
      .send("nickname=nickerinack")
      .send("previousNickname=bibabu")
      .send("email=here@there.org")
      .send("previousEmail=there@wherever.com")
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Dieser Nickname ist leider nicht verfügbar\./)
      .expect(/Diese Adresse ist schon registriert\. Hast Du bereits ein Profil angelegt?/, done);
  });

  it("saves an existing member and does not trigger notification sending", (done) => {
    sinon.stub(membersService, "isValidNickname").callsFake((nickname, callback) => {
      callback(null, true);
    });
    sinon.stub(membersService, "isValidEmail").callsFake((nickname, callback) => {
      callback(null, true);
    });
    sinon.stub(groupsService, "updateSubscriptions").callsFake(() => {});
    sinon.stub(memberstore, "saveMember").callsFake((member, callback) => {
      callback(null);
    });
    const notificationCall = sinon.stub(notifications, "newMemberRegistered").callsFake(() => undefined);

    // the following stub indicates that the member already exists
    sinon.stub(groupsAndMembersService, "getMemberWithHisGroups").callsFake((nickname, callback) => {
      callback(null, dummymember);
    });
    request(createApp({ id: "memberID" }))
      .post("/submit")
      .send("id=0815&firstname=A&lastname=B&location=x&profession=y&reference=z&country=x")
      .send("nickname=nickerinack")
      .send("email=here@there.org")
      .expect(302)
      .expect("location", /members\/nickerinack/, (err) => {
        expect(notificationCall.called).to.be(false);
        done(err);
      });
  });

  it("saves a new member and triggers notification sending", (done) => {
    sinon.stub(membersService, "isValidNickname").callsFake((nickname, callback) => {
      callback(null, true);
    });
    sinon.stub(membersService, "isValidEmail").callsFake((nickname, callback) => {
      callback(null, true);
    });
    sinon.stub(groupsService, "updateSubscriptions").callsFake(() => {});
    sinon.stub(memberstore, "saveMember").callsFake((member, callback) => {
      callback(null);
    });
    const notificationCall = sinon.stub(notifications, "newMemberRegistered").callsFake(() => undefined);

    // the following stub indicates that the member does not exist yet
    sinon.stub(groupsAndMembersService, "getMemberWithHisGroups").callsFake((nickname, callback) => {
      callback(null);
    });
    request(createApp({ id: "memberID" }))
      .post("/submit")
      .send("id=0815&firstname=A&lastname=B&location=x&profession=y&reference=z")
      .send("nickname=nickerinack")
      .send("email=here@there.org")
      .expect(302)
      .expect("location", /members\/nickerinack/, (err) => {
        expect(notificationCall.called).to.be(true);
        done(err);
      });
  });
});
