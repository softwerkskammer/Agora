'use strict';

var nconf = require('../../testutil/configureForTestWithDB');
var expect = require('must');

var beans = nconf.get('beans');
var persistence = beans.get('activitiesPersistence');

var CONFLICTING_VERSIONS = beans.get('constants').CONFLICTING_VERSIONS;

var getEntry = function (callback) {
  persistence.getByField({url: 'url'}, callback);
};


describe('Persistence with DB', function () {

  var emptyRecord = {id: 'id', url: 'url', entries: []};


  beforeEach(function (done) { // if this fails, you need to start your mongo DB
    persistence.drop(function () {
      // save our sample activity
      persistence.saveWithVersion(emptyRecord, function (err) {
        done(err);
      });
    });
  });

  // Note: This test only shows the general mechanism of avoiding racing conditions with the help of version numbers.
  // This does not mean that the activity code already implements this!
  it('has a racing condition when updating a document twice in quick succession', function (done) {
    // load activity for the first time:
    getEntry(function (err, entry1) {
      // add member to loaded instance:
      entry1.entries.push('entry1');
      // load activity for the second time:
      getEntry(function (err, entry2) {
        // add member to the second instance:
        entry2.entries.push('entry2');
        // save first instance:
        persistence.saveWithVersion(entry1, function () {
          // load it again:
          getEntry(function (err, entry) {
            expect(entry.entries, 'First entry is stored').to.contain('entry1');
            // save second instance:
            persistence.saveWithVersion(entry2, function (err) {
              expect(err.message).to.equal(CONFLICTING_VERSIONS); // Conflict is discovered
              // repeat loading and adding:
              getEntry(function (err, entry2) {
                entry2.entries.push('entry2');
                persistence.saveWithVersion(entry2, function () {
                  // load the resulting activity
                  getEntry(function (err, entry) {
                    expect(entry.entries, 'Second entry is stored').to.contain('entry2');
                    // Bug #578: This expectation should work
                    expect(entry.entries, 'First entry is still there').to.contain('entry1');
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
