"use strict";

const expect = require("must-dist");

const persistence = require("../../lib/activities/activitiesPersistence");

const CONFLICTING_VERSIONS = require("../../lib/commons/constants").CONFLICTING_VERSIONS;

function getEntry() {
  return persistence.getByField({ key: "url", val: "url" });
}

describe("Persistence with DB", () => {
  const emptyRecord = { id: "id", url: "url", entries: [] };

  beforeEach(() => {
    // if this fails, you need to start your mongo DB
    persistence.recreateForTest();
    // save our sample activity
    persistence.saveWithVersion(emptyRecord);
  });

  // Note: This test only shows the general mechanism of avoiding racing conditions with the help of version numbers.
  // This does not mean that the activity code already implements this!
  it("has a racing condition when updating a document twice in quick succession", () => {
    // load activity for the first time:
    const entry1 = getEntry();
    // add member to loaded instance:
    entry1.entries.push("entry1");
    // load activity for the second time:
    const entry2 = getEntry();
    // add member to the second instance:
    entry2.entries.push("entry2");
    // save first instance:
    persistence.saveWithVersion(entry1);
    // load it again:
    const entry = getEntry();
    expect(entry.entries, "First entry is stored").to.contain("entry1");
    // save second instance:
    try {
      persistence.saveWithVersion(entry2);
      expect(false).to.be(true);
    } catch (e) {
      expect(e.message).to.equal(CONFLICTING_VERSIONS); // Conflict is discovered
    }
    // repeat loading and adding:
    const entry3 = getEntry();
    entry3.entries.push("entry2");
    persistence.saveWithVersion(entry3);
    // load the resulting activity
    const entry4 = getEntry();
    expect(entry4.entries, "Second entry is stored").to.contain("entry2");
    // Bug #578: This expectation should work
    expect(entry4.entries, "First entry is still there").to.contain("entry1");
  });
});
