"use strict";

const expect = require("must-dist");

const sinon = require("sinon").createSandbox();

const beans = require("../../testutil/configureForTest").get("beans");
const persistence = beans.get("membersPersistence");
const store = beans.get("memberstore");
const Member = beans.get("member");

describe("Members store", () => {
  const sampleMember = { nickname: "nick", email: "nicks mail", firstname: "first", lastname: "a" };
  const sampleMember2 = { nickname: "nick2", email: "nick2s mail", firstname: "first", lastname: "b" };

  const sampleList = [sampleMember, sampleMember2];

  afterEach(() => {
    sinon.restore();
  });

  it("calls persistence.getById for store.getMemberForId and passes on the given callback", async () => {
    const getById = sinon.stub(persistence, "getMongoById").returns(sampleMember);
    const member = await store.getMemberForId("id");
    expect(member.nickname()).to.equal(sampleMember.nickname);
    expect(getById.calledWith("id")).to.be(true);
  });

  it("calls persistence.listByIds for store.getMembersForIds and passes on the given callback", async () => {
    const listByIds = sinon.stub(persistence, "listMongoByIds").returns(sampleList);

    const members = await store.getMembersForIds(["id1", "id2"]);
    expect(members[0].nickname()).to.equal(sampleMember.nickname);
    expect(members[1].nickname()).to.equal(sampleMember2.nickname);
    expect(listByIds.calledWith(["id1", "id2"])).to.be(true);
  });

  it("calls persistence.getByField for store.getMemberForEMail and passes on the given callback", async () => {
    sinon.stub(persistence, "getMongoByField").callsFake((object) => {
      if (object.email.test("nick2s mail")) {
        return sampleMember2;
      }
      if (object.email.test("nicks mail")) {
        return sampleMember;
      }
      return null;
    });
    const member = await store.getMemberForEMail("nicks mail");
    expect(member.nickname()).to.equal(sampleMember.nickname);
  });

  it("calls persistence.getByField for each member for store.getMembersForEMails and passes on the given callback", async () => {
    sinon.stub(persistence, "listMongoByField").returns(sampleList);
    const members = await store.getMembersForEMails(["nicks mail", "nick2s mail"]);
    expect(members.length).to.equal(2);
    expect(members[0].nickname()).to.equal(sampleMember.nickname);
    expect(members[1].nickname()).to.equal(sampleMember2.nickname);
    expect(members[0]).to.be.instanceOf(Member);
  });

  it("calls persistence.getByField with an appropriate regex", async () => {
    const getByField = sinon.stub(persistence, "getMongoByField").returns(sampleMember);
    const member = await store.getMember("nick");
    expect(member.nickname()).to.equal(sampleMember.nickname);
    expect(getByField.called).to.be(true);
    const regex = getByField.args[0][0].nickname;
    expect(regex.toString()).to.equal("/^nick$/i");
  });

  it("calls persistence.list for store.allMembers and passes on the given callback", async () => {
    sinon.stub(persistence, "listMongoByField").returns(sampleList);
    const members = await store.allMembers();

    expect(members[0].nickname()).to.equal(sampleMember.nickname);
    expect(members[1].nickname()).to.equal(sampleMember2.nickname);
  });

  it("sorts case insensitive by lastname", async () => {
    const adonis = { lastname: "Adonis", firstname: "Zaza" };
    const betti = { lastname: "Betti", firstname: "Andi" };
    const dave = { lastname: "Dave", firstname: "Dave" };
    const bettiLow = { lastname: "betti", firstname: "Bodo" };
    const adonisLow = { lastname: "adonis", firstname: "Abbu" };

    sinon.stub(persistence, "listMongoByField").returns([adonis, betti, dave, bettiLow, adonisLow]);

    const members = await store.allMembers();
    expect(members[0].lastname()).to.equal(adonisLow.lastname);
    expect(members[1].lastname()).to.equal(adonis.lastname);
    expect(members[2].lastname()).to.equal(betti.lastname);
    expect(members[3].lastname()).to.equal(bettiLow.lastname);
    expect(members[4].lastname()).to.equal(dave.lastname);
  });

  it("sorts by lastname - not parsing numbers", async () => {
    const tata1 = { lastname: "Tata1", firstname: "Egal" };
    const tata10 = { lastname: "Tata10", firstname: "Egal" };
    const tata2 = { lastname: "Tata2", firstname: "Egal" };

    sinon.stub(persistence, "listMongoByField").returns([tata1, tata10, tata2]);

    const members = await store.allMembers();
    expect(members[0].lastname()).to.equal(tata1.lastname);
    expect(members[1].lastname()).to.equal(tata10.lastname);
    expect(members[2].lastname()).to.equal(tata2.lastname);
  });

  it("calls persistence.save for store.saveMember and passes on the given callback", async () => {
    const save = sinon.stub(persistence, "saveMongo").callsFake(() => {});

    await store.saveMember(sampleMember);
    expect(save.calledWith(sampleMember.state)).to.be(true);
  });

  it("calls persistence.remove for store.removeMember and passes on the given callback", async () => {
    const remove = sinon.stub(persistence, "removeMongo");
    const member = new Member(sampleMember);
    member.state.id = "I D";
    await store.removeMember(member);
    expect(remove.calledWith("I D")).to.be(true);
  });

  it("returns an empty array when asked for all members for empty email list", async () => {
    const members = await store.getMembersForEMails([]);
    expect(members).to.be.empty();
  });
});
