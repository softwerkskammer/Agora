"use strict";

/**
 * Test for https://github.com/softwerkskammer/Agora/issues/1105
 */
const persistence = require("../../lib/members/membersPersistence");

describe("Persistence", () => {
  describe("listByFieldWithOptions()", () => {
    it("should not throw error if list is empty", () => {
      persistence.listByWhere("id = 'bar' ");
    });
  });
});
