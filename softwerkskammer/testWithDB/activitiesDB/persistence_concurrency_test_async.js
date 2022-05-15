"use strict";

const expect = require("must-dist");

const beans = require("../../testutil/configureForTestWithDB").get("beans");
const persistence = beans.get("activitiesPersistence");

const CONFLICTING_VERSIONS = beans.get("constants").CONFLICTING_VERSIONS;

async function getEntry() {
  return persistence.getByFieldAsync({ url: "url" });
}

describe("Persistence with DB", () => {
  const emptyRecord = { id: "id", url: "url", entries: [] };

  beforeEach(async () => {
    // if this fails, you need to start your mongo DB
    await persistence.dropAsync();
    // save our sample activity
    await persistence.saveWithVersionAsync(emptyRecord);
  });

  // Note: This test only shows the general mechanism of avoiding racing conditions with the help of version numbers.
  // This does not mean that the activity code already implements this!
  it("has a racing condition when updating a document twice in quick succession", async () => {
    // load activity for the first time:
    const entry1 = await getEntry();
    // add member to loaded instance:
    entry1.entries.push("entry1");
    // load activity for the second time:
    const entry2 = await getEntry();
    // add member to the second instance:
    entry2.entries.push("entry2");
    // save first instance:
    await persistence.saveWithVersionAsync(entry1);
    // load it again:
    const entry = await await getEntry();
    expect(entry.entries, "First entry is stored").to.contain("entry1");
    // save second instance:
    try {
      await persistence.saveWithVersionAsync(entry2);
      expect(false).to.be(true);
    } catch (e) {
      expect(e.message).to.equal(CONFLICTING_VERSIONS); // Conflict is discovered
    }
    // repeat loading and adding:
    const entry3 = await getEntry();
    entry3.entries.push("entry2");
    await persistence.saveWithVersionAsync(entry3);
    // load the resulting activity
    const entry4 = await getEntry();
    expect(entry4.entries, "Second entry is stored").to.contain("entry2");
    // Bug #578: This expectation should work
    expect(entry4.entries, "First entry is still there").to.contain("entry1");
  });
});
