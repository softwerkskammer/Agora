"use strict";

const sinon = require("sinon").createSandbox();
const expect = require("must-dist");
const beans = require("../../testutil/configureForTest").get("beans");
const wikiService = beans.get("wikiService");
const Git = beans.get("gitmech");

describe("Wiki Service - Event Parsing", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("parses an expected content", (done) => {
    const wikifile =
      "## Europaweite Veranstaltungen 2016\n" +
      "\n" +
      "Diese Seite bietet eine Übersicht über Konferenzen und ähnliche Veranstaltungen rund um Craft, Testing und Softwareentwicklung.\n" +
      "\n" +
      "Konferenzen, bei denen kein Datum angegeben ist, haben in den Vorjahren um diese Zeit stattgefunden. Wir haben jedoch noch keine aktuellen Informationen. (Weißt Du mehr? Dann trag das Datum und den Link einfach ein!)\n" +
      "\n" +
      "Konferenz | Ort | Wann\n" +
      "--- | ---   | ---\n" +
      "`Januar` |   |\n" +
      "[Codefreeze](http://www.codefreeze.fi/) | Kiilopää, Inari, Finnland   | 11.1.  \n" +
      "[DDD Europe](http://dddeurope.com) | Brüssel, Belgien | 28.1. -  29.1.\n" +
      "[Test Driven GeeCON](http://2015.tdd.geecon.org/)| Poznan, Polen  | \n" +
      "[The First International Conference on Software Archaeology](http://ticosa.org) | London   |\n" +
      "`Februar` |   |\n" +
      "[OOP](http://www.oop-konferenz.de/) | München  | 1.2.\n" +
      "[microXchg - The Microservices Conference](http://microxchg.io) | Berlin | 4.2.  - 5.2.";

    sinon.stub(Git, "readFile").callsFake((name, version, callback) => {
      callback(null, wikifile);
    });

    wikiService.parseEvents(2018, (err, events) => {
      expect(events).to.have.length(4);
      expect(events[0].start).to.eql("2018-01-11T00:00:00.000Z");
      expect(events[0].end).to.eql("2018-01-11T22:00:00.000Z");
      done();
    });
  });
});
