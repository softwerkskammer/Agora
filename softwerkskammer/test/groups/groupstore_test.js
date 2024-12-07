"use strict";

require("../../testutil/configureForTest");

const sinon = require("sinon");
const expect = require("must-dist");

const persistence = require("../../lib/groups/groupsPersistence");
const store = require("../../lib/groups/groupstore");

describe("Groups store", () => {
  const sampleGroup = { id: "groupa" };
  let getById;

  before(() => {
    getById = sinon.stub(persistence, "getById");
    getById.returns(sampleGroup);
  });

  after(() => {
    persistence.getById.restore();
  });

  it("retrieves groupnames given the intended case", () => {
    const queriedId = "groupA";
    const group = store.getGroup(queriedId);
    expect(group.id).to.equal(sampleGroup.id);
    expect(getById.args[0][0]).to.equal(queriedId);
  });

  it("retrieves groupnames given a different case", () => {
    const queriedId = "GRouPA";
    const group = store.getGroup(queriedId);
    expect(group.id).to.equal(sampleGroup.id);
    expect(getById.args[0][0]).to.equal("groupA");
  });
});
