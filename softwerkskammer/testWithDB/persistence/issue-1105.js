"use strict";

/**
 * Test for https://github.com/softwerkskammer/Agora/issues/1105
 */
const beans = require("../../testutil/configureForTestWithDB").get("beans");
const persistence = beans.get("membersPersistence");

describe("Persistence", () => {
  describe("listByFieldWithOptions()", () => {
    it("should not throw error if list is empty", (done) => {
      persistence.listByField({ foo: "bar" }, {}, (err) => done(err));
    });
  });
});
