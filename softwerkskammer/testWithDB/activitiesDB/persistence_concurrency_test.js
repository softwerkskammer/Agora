"use strict";

const expect = require("must-dist");

const beans = require("../../testutil/configureForTestWithDB").get("beans");
const persistence = beans.get("activitiesPersistence");

const CONFLICTING_VERSIONS = beans.get("constants").CONFLICTING_VERSIONS;

function getEntry(callback) {
  persistence.getByField({ url: "url" }, callback);
}

describe("Persistence with DB", () => {
  const emptyRecord = { id: "id", url: "url", entries: [] };

  beforeEach((done) => {
    // if this fails, you need to start your mongo DB
    persistence.drop(() => {
      // save our sample activity
      persistence.saveWithVersion(emptyRecord, (err) => {
        done(err);
      });
    });
  });

  // Note: This test only shows the general mechanism of avoiding racing conditions with the help of version numbers.
  // This does not mean that the activity code already implements this!
  it("has a racing condition when updating a document twice in quick succession", (done) => {
    // load activity for the first time:
    getEntry((err, entry1) => {
      // add member to loaded instance:
      entry1.entries.push("entry1");
      // load activity for the second time:
      getEntry((err1, entry2) => {
        // add member to the second instance:
        entry2.entries.push("entry2");
        // save first instance:
        persistence.saveWithVersion(entry1, () => {
          // load it again:
          getEntry((err2, entry) => {
            expect(entry.entries, "First entry is stored").to.contain("entry1");
            // save second instance:
            persistence.saveWithVersion(entry2, (err3) => {
              expect(err3.message).to.equal(CONFLICTING_VERSIONS); // Conflict is discovered
              // repeat loading and adding:
              getEntry((err4, entry3) => {
                entry3.entries.push("entry2");
                persistence.saveWithVersion(entry3, () => {
                  // load the resulting activity
                  getEntry((err5, entry4) => {
                    expect(entry4.entries, "Second entry is stored").to.contain("entry2");
                    // Bug #578: This expectation should work
                    expect(entry4.entries, "First entry is still there").to.contain("entry1");
                    done(err);
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
