"use strict";

require("../../testutil/configureForTest");

const sinon = require("sinon").createSandbox();
const expect = require("must-dist");

const wikiSubdirs = require("../../lib/middleware/wikiSubdirs");
const Git = require("../../lib/wiki/gitmech");
const Group = require("../../lib/groups/group");
const groupstore = require("../../lib/groups/groupstore");

describe("Wikisubdirs", () => {
  const allGroups = [
    new Group({ id: "a", type: Group.allTypes()[0] }),
    new Group({ id: "b", type: Group.allTypes()[0] }),
    new Group({ id: "c", type: Group.allTypes()[1] }),
    new Group({ id: "groupWithoutWiki", type: Group.allTypes()[1] }),
  ];
  beforeEach(() => {
    sinon.stub(Git, "lsdirs").returns(["a", "c", "b", "andere"]);
    sinon.stub(groupstore, "allGroups").returns(allGroups);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("transforms the dirs and groups correctly", async () => {
    const req = {
      originalUrl: "/something",
      headers: {},
      cookies: {},
      signedCookies: {},
    };
    const res = { locals: {} };
    const next = () => "";
    await wikiSubdirs(req, res, next);
    expect(res.locals.structuredWikisubdirs.regional).to.eql(["c"]);
    expect(res.locals.structuredWikisubdirs.themed).to.eql(["a", "b"]);
    expect(res.locals.structuredWikisubdirs.other).to.eql(["andere"]);
  });
});
