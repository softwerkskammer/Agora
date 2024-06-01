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

  it("calls persistence.getById for store.getMemberForId and passes on the given callback", () => {
    const getById = sinon.stub(persistence, "getById").returns(sampleMember);
    const member = store.getMemberForId("id");
    expect(member.nickname()).to.equal(sampleMember.nickname);
    expect(getById.calledWith("id")).to.be(true);
  });

  it("calls persistence.listByIds for store.getMembersForIds and passes on the given callback", () => {
    const listByIds = sinon.stub(persistence, "listByIds").returns(sampleList);

    const members = store.getMembersForIds(["id1", "id2"]);
    expect(members[0].nickname()).to.equal(sampleMember.nickname);
    expect(members[1].nickname()).to.equal(sampleMember2.nickname);
    expect(listByIds.calledWith(["id1", "id2"])).to.be(true);
  });

  it("calls persistence.getByWhere for store.getMemberForEMail and passes on the given callback", () => {
    sinon.stub(persistence, "getByWhere").callsFake((object) => {
      if (object.indexOf("'nick2s mail'") > -1) {
        return sampleMember2;
      }
      if (object.indexOf("'nicks mail'") > -1) {
        return sampleMember;
      }
      return null;
    });
    const member = store.getMemberForEMail("nicks mail");
    expect(member.nickname()).to.equal(sampleMember.nickname);
  });

  it("calls persistence.getByWhere with an appropriate regex", () => {
    const getByField = sinon.stub(persistence, "getByWhere").returns(sampleMember);
    const member = store.getMember("nick");
    expect(member.nickname()).to.equal(sampleMember.nickname);
    expect(getByField.called).to.be(true);
    const arg = getByField.args[0][0];
    expect(arg).to.equal("json_extract ( data, '$.nickname' ) = 'nick'");
  });

  it("calls persistence.list for store.allMembers and passes on the given callback", () => {
    sinon.stub(persistence, "list").returns(sampleList);
    const members = store.allMembers();

    expect(members[0].nickname()).to.equal(sampleMember.nickname);
    expect(members[1].nickname()).to.equal(sampleMember2.nickname);
  });

  it("sorts case insensitive by lastname", () => {
    const adonis = { lastname: "Adonis", firstname: "Zaza" };
    const betti = { lastname: "Betti", firstname: "Andi" };
    const dave = { lastname: "Dave", firstname: "Dave" };
    const bettiLow = { lastname: "betti", firstname: "Bodo" };
    const adonisLow = { lastname: "adonis", firstname: "Abbu" };

    sinon.stub(persistence, "list").returns([adonis, betti, dave, bettiLow, adonisLow]);

    const members = store.allMembers();
    expect(members[0].lastname()).to.equal(adonisLow.lastname);
    expect(members[1].lastname()).to.equal(adonis.lastname);
    expect(members[2].lastname()).to.equal(betti.lastname);
    expect(members[3].lastname()).to.equal(bettiLow.lastname);
    expect(members[4].lastname()).to.equal(dave.lastname);
  });

  it("sorts by lastname - not parsing numbers", () => {
    const tata1 = { lastname: "Tata1", firstname: "Egal" };
    const tata10 = { lastname: "Tata10", firstname: "Egal" };
    const tata2 = { lastname: "Tata2", firstname: "Egal" };

    sinon.stub(persistence, "list").returns([tata1, tata10, tata2]);

    const members = store.allMembers();
    expect(members[0].lastname()).to.equal(tata1.lastname);
    expect(members[1].lastname()).to.equal(tata10.lastname);
    expect(members[2].lastname()).to.equal(tata2.lastname);
  });

  it("calls persistence.save for store.saveMember and passes on the given callback", () => {
    const save = sinon.stub(persistence, "save").callsFake(() => {});

    store.saveMember(sampleMember);
    expect(save.calledWith(sampleMember.state)).to.be(true);
  });

  it("calls persistence.remove for store.removeMember and passes on the given callback", () => {
    const remove = sinon.stub(persistence, "removeById");
    const member = new Member(sampleMember);
    member.state.id = "I D";
    store.removeMember(member);
    expect(remove.calledWith("I D")).to.be(true);
  });
});
