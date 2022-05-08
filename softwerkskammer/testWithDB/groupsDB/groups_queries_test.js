"use strict";

const expect = require("must-dist");

const beans = require("../../testutil/configureForTestWithDB").get("beans");
const groupstore = beans.get("groupstore");
const persistence = beans.get("groupsPersistence");
const Group = beans.get("group");

describe("Groups application with DB", () => {
  describe("getGroupsWithMeetupURL", () => {
    const group1 = new Group({ id: "withouturl" });
    const group2 = new Group({ id: "withnullurl", meetupURL: null });
    const group3 = new Group({ id: "withundefinedurl", meetupURL: undefined });
    const group4 = new Group({ id: "withemptyurl", meetupURL: "" });
    const group5 = new Group({ id: "withurl", meetupURL: "https://my.meetup.org/group/" });

    beforeEach((done) => {
      // if this fails, you need to start your mongo DB
      persistence.drop(() => {
        groupstore.saveGroup(group1, (err1) => {
          if (err1) {
            done(err1);
          }
          groupstore.saveGroup(group2, (err2) => {
            if (err2) {
              done(err2);
            }
            groupstore.saveGroup(group3, (err3) => {
              if (err3) {
                done(err3);
              }
              groupstore.saveGroup(group4, (err4) => {
                if (err4) {
                  done(err4);
                }
                groupstore.saveGroup(group5, (err5) => {
                  done(err5);
                });
              });
            });
          });
        });
      });
    });

    it("returns only the group that has a nonempty URL", async () => {
      const groups = await groupstore.getGroupsWithMeetupURL();
      expect(groups).to.have.length(1);
      expect(groups[0].id).to.be("withurl");
    });
  });
});
