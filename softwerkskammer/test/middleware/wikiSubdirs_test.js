"use strict";

const sinon = require("sinon").createSandbox();
const expect = require("must-dist");

const beans = require("../../testutil/configureForTest").get("beans");
const wikiSubdirs = beans.get("wikiSubdirs");
const Git = beans.get("gitmech");
const Group = beans.get("group");
const groupstore = beans.get("groupstore");

describe("Wikisubdirs", () => {
  const allGroups = [
    new Group({ id: "a", type: Group.allTypes()[0] }),
    new Group({ id: "b", type: Group.allTypes()[0] }),
    new Group({ id: "c", type: Group.allTypes()[1] }),
    new Group({ id: "groupWithoutWiki", type: Group.allTypes()[1] }),
  ];
  beforeEach(() => {
    sinon.stub(Git, "lsdirs").callsFake((callback) => {
      callback(null, ["a", "c", "b", "andere"]);
    });
    sinon.stub(groupstore, "allGroups").returns(allGroups);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("transforms the dirs and groups correctly", () => {
    const req = {
      originalUrl: "/something",
      headers: {},
      cookies: {},
      signedCookies: {},
    };
    const res = { locals: {} };
    const next = () => "";
    wikiSubdirs(req, res, next);
    expect(res.locals.structuredWikisubdirs.regional).to.eql(["c"]);
    expect(res.locals.structuredWikisubdirs.themed).to.eql(["a", "b"]);
    expect(res.locals.structuredWikisubdirs.other).to.eql(["andere"]);
  });
});
