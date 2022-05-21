"use strict";

const expect = require("must-dist");
const R = require("ramda");

describe("Ramda", () => {
  describe("curry function", () => {
    it("does not pass undefined when function is invoked with less arguments than specified - be careful!", () => {
      const testfunc = (arg1, arg2) => arg1 + " " + arg2;
      const testfuncCurried = R.curry(testfunc)("Argument1");
      const testfuncPartial = R.partial(testfunc, ["Argument1"]);

      expect(testfuncCurried("Argument2")).to.equal("Argument1 Argument2");
      expect(testfuncPartial("Argument2")).to.equal("Argument1 Argument2");

      expect(testfuncPartial()).to.equal("Argument1 undefined");

      expect(testfuncCurried()).to.not.equal("Argument1 undefined"); // Trouble!
      expect(testfuncCurried()).to.be.a(Function); // of course
    });
  });
});
