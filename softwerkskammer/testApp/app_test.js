"use strict";
const expect = require("must-dist");
const httpRequest = require("superagent");
const sinon = require("sinon").createSandbox();
const conf = require("../testutil/configureForTest");
const beans = conf.get("beans");
const groupstore = beans.get("groupstore");

const baseUri = `http://localhost:${parseInt(conf.get("port"), 10)}`;

const app = require("../app.js");

describe("SWK Plattform server", () => {
  beforeEach((done) => {
    sinon.stub(groupstore, "allGroups").returns([]);
    app.start(done);
  });

  afterEach((done) => {
    sinon.restore();
    app.stop(done);
  });

  it("responds with HTML on a GET for the home page showing 'Softwerkskammer' and translated page text", async () => {
    const resp = await httpRequest.get(baseUri);
    expect(resp).to.exist();
    expect(resp.statusCode).to.equal(200);
    expect(resp.headers["content-type"]).to.contain("text/html");
    expect(resp.text).to.contain("Softwerkskammer");
    expect(resp.text).to.contain(
      "Die Softwerkskammer hat sich 2011 gegründet, um den Austausch Interessierter zum Thema Software Craft und Testing\nzu vereinfachen."
    );
  });

  it("provides the screen style sheet", async () => {
    const resp = await httpRequest.get(baseUri + "/stylesheets/screen.css");
    expect(resp.statusCode).to.equal(200);
    expect(resp.headers["content-type"]).to.contain("text/css");
    expect(resp.text).to.contain("color:");
  });

  it("provides the clientside membercheck functions", async () => {
    const resp = await httpRequest.get(baseUri + "/clientscripts/check-memberform.js");
    expect(resp.statusCode).to.equal(200);
    expect(resp.headers["content-type"]).to.contain("application/javascript");
    expect(resp.body.toString()).to.contain("#memberform");
  });
});

describe("SWK Plattform server with Error", () => {
  beforeEach((done) => {
    sinon.stub(groupstore, "allGroups").throws(new Error());
    app.start(done);
  });

  afterEach((done) => {
    sinon.restore();
    app.stop(done);
  });

  it("renders the i18n translated text on the home page correctly", async () => {
    try {
      await httpRequest.get(baseUri);
    } catch (e) {
      const text = e.response.text;
      expect(text).to.contain("<li>Was hast Du getan?</li>");
      expect(text).to.contain("<li>Betriebssystem und Browser inkl. Version.</li>");
      expect(text).to.contain("<li>Den Stacktrace</li>");
      expect(text).to.contain("<p>Das Agora-Team bittet um Entschuldigung.</p>");
    }
  });
});
