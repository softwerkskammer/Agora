"use strict";

require("../../testutil/configureForTest");
const beans = require("simple-configure").get("beans");
const expect = require("must-dist");

const WaitinglistEntry = beans.get("waitinglistEntry");

const entryWithoutParam = new WaitinglistEntry();
const registrationDate = new Date(2013, 1, 23, 17, 44);
const entryWithParam = new WaitinglistEntry({ _memberId: "12345", _registeredAt: registrationDate }, "Meine Ressource");

describe("Waitinglist Entry", () => {
  it("without argument yields undefined for each query", () => {
    expect(entryWithoutParam.registrantId()).to.be(undefined);
    expect(entryWithoutParam.resourceName()).to.be("Veranstaltung");
    expect(entryWithoutParam.registrationDate()).to.be(undefined);
    expect(entryWithoutParam.registrationValidUntil()).to.be(undefined);
  });

  it("returns the id of the registrant", () => {
    expect(entryWithParam.registrantId()).to.equal("12345");
  });

  it("returns the resource name", () => {
    expect(entryWithParam.resourceName()).to.equal("Veranstaltung");
  });

  it("returns the registration date", () => {
    expect(entryWithParam.registrationDate()).to.equal("23.02.2013 17:44");
  });

  it("initially has no registration validity limit", () => {
    expect(entryWithParam.registrationValidUntil()).to.be(undefined);
  });

  it("has a registration validity limit when it is set", () => {
    entryWithParam.setRegistrationValidityFor("3");
    expect(entryWithParam.registrationValidUntil()).to.not.be(undefined);
  });

  it("can remove the registration validity limit after setting it", () => {
    entryWithParam.setRegistrationValidityFor("3");
    entryWithParam.setRegistrationValidityFor();
    expect(entryWithParam.registrationValidUntil()).to.be(undefined);
  });
});
