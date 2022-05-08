"use strict";
const expect = require("must-dist");
const i18n = require("i18next");

require("../../testutil/configureForTest");
const beans = require("simple-configure").get("beans");
const validation = beans.get("validation");
beans.get("initI18N");

function translateMessages(messages) {
  return messages.map((message) => i18n.t(message));
}

describe("Validation", () => {
  describe("isValidForActivity", () => {
    it("performs many checks simultaneously", () => {
      const result = validation.isValidForActivity({});

      expect(result.length).to.equal(8);
    });

    it("does not validate activity input without title", () => {
      const result = validation.isValidForActivity({});

      expect(result).to.contain("Titel ist ein Pflichtfeld.");
    });

    it("does not validate activity input without group", () => {
      const result = validation.isValidForActivity({});

      expect(result).to.contain("Gruppe ist ein Pflichtfeld.");
    });

    it('does not validate activity url with "/"', () => {
      const result = validation.isValidForActivity({ url: "/" });

      expect(result).to.contain('URL darf kein "/" enthalten.');
    });

    //////

    it("validates resource limits of activity input without resources", () => {
      const result = validation.isValidForActivity({});

      expect(result).to.not.contain("Die Ressourcenbeschränkungen dürfen nur aus Ziffern bestehen.");
    });

    it("validates resource limits of activity input without resource limits", () => {
      const result = validation.isValidForActivity({ resources: {} });

      expect(result).to.not.contain("Die Ressourcenbeschränkungen dürfen nur aus Ziffern bestehen.");
    });

    it("validates resource limits of activity input with an empty resource limit", () => {
      const result = validation.isValidForActivity({ resources: { limits: "" } });

      expect(result).to.not.contain("Die Ressourcenbeschränkungen dürfen nur aus Ziffern bestehen.");
    });

    it("validates resource limits of activity input with an empty resource limit array", () => {
      const result = validation.isValidForActivity({ resources: { limits: [] } });

      expect(result).to.not.contain("Die Ressourcenbeschränkungen dürfen nur aus Ziffern bestehen.");
    });

    it("validates resource limits of activity input with several empty resource limits", () => {
      const result = validation.isValidForActivity({ resources: { limits: ["", ""] } });

      expect(result).to.not.contain("Die Ressourcenbeschränkungen dürfen nur aus Ziffern bestehen.");
    });

    it("validates resource limits of activity input with an int resource limit", () => {
      const result = validation.isValidForActivity({ resources: { limits: "10" } });

      expect(result).to.not.contain("Die Ressourcenbeschränkungen dürfen nur aus Ziffern bestehen.");
    });

    it("validates resource limits of activity input with at least one int resource limit", () => {
      const result = validation.isValidForActivity({ resources: { limits: ["", "-77", ""] } });

      expect(result).to.not.contain("Die Ressourcenbeschränkungen dürfen nur aus Ziffern bestehen.");
    });

    it("does not validate resource limits of activity input with a non-int decimal resource limit", () => {
      const result = validation.isValidForActivity({ resources: { limits: "7.5" } });

      expect(result).to.contain("Die Ressourcenbeschränkungen dürfen nur aus Ziffern bestehen.");
    });

    it("does not validate resource limits of activity input with a textual resource limit", () => {
      const result = validation.isValidForActivity({ resources: { limits: "abc" } });

      expect(result).to.contain("Die Ressourcenbeschränkungen dürfen nur aus Ziffern bestehen.");
    });

    //////

    it("does not validate start and end of activity input when end date is before start date", () => {
      const result = validation.isValidForActivity({
        startDate: "01.01.2013",
        startTime: "12:00",
        endDate: "01.10.2012",
        endTime: "12:00",
      });

      expect(result).to.contain("Start muss vor Ende liegen.");
    });

    it("does not validate start and end of activity input when end time is before start time", () => {
      const result = validation.isValidForActivity({
        startDate: "01.01.2013",
        startTime: "12:00",
        endDate: "01.01.2013",
        endTime: "11:00",
      });

      expect(result).to.contain("Start muss vor Ende liegen.");
    });

    it("does not validate start and end of activity input when end time is same as start time", () => {
      const result = validation.isValidForActivity({
        startDate: "01.01.2013",
        startTime: "12:00",
        endDate: "01.01.2013",
        endTime: "12:00",
      });

      expect(result).to.contain("Start muss vor Ende liegen.");
    });

    it("validates start and end of activity input when end is after start", () => {
      const result = validation.isValidForActivity({
        startDate: "01.01.2013",
        startTime: "12:00",
        endDate: "01.01.2013",
        endTime: "13:00",
      });

      expect(result).to.not.contain("Start muss vor Ende liegen.");
    });
  });

  describe("isValidGroup", () => {
    const result = (object) => validation.isValidGroup(object);

    it("performs many checks simultaneously", () => {
      expect(result({}).length).to.equal(10);
    });

    it("checks that id is set", () => {
      expect(result({})).to.contain("Name ist ein Pflichtfeld.");
      expect(result({ id: null })).to.contain("Name ist ein Pflichtfeld.");
      expect(result({ id: "n" })).to.not.contain("Name ist ein Pflichtfeld.");
    });

    it("checks that id is longer than 2 and shorter than 20 letters", () => {
      expect(result({ id: null })).to.contain("Name muss mindestens 2 und höchstens 20 Zeichen enthalten.");
      expect(result({ id: "n" })).to.contain("Name muss mindestens 2 und höchstens 20 Zeichen enthalten.");
      expect(result({ id: "nn" })).to.not.contain("Name muss mindestens 2 und höchstens 20 Zeichen enthalten.");
      expect(result({ id: "12345678901234567890" })).to.not.contain(
        "Name muss mindestens 2 und höchstens 20 Zeichen enthalten."
      );
      expect(result({ id: "12345678901234567890+" })).to.contain(
        "Name muss mindestens 2 und höchstens 20 Zeichen enthalten."
      );
    });

    it("checks that id can contain chars, numbers, dash and underscore", () => {
      expect(result({ id: "abc123ABC_-" })).to.not.contain(
        "Name darf nur Buchstaben, Zahlen, Bindestrich und Unterstrich enthalten."
      );
      expect(result({ id: "ä" })).to.contain(
        "Name darf nur Buchstaben, Zahlen, Bindestrich und Unterstrich enthalten."
      );
      expect(result({ id: "Ä" })).to.contain(
        "Name darf nur Buchstaben, Zahlen, Bindestrich und Unterstrich enthalten."
      );
      expect(result({ id: "ß" })).to.contain(
        "Name darf nur Buchstaben, Zahlen, Bindestrich und Unterstrich enthalten."
      );
      expect(result({ id: "%" })).to.contain(
        "Name darf nur Buchstaben, Zahlen, Bindestrich und Unterstrich enthalten."
      );
      expect(result({ id: " " })).to.contain(
        "Name darf nur Buchstaben, Zahlen, Bindestrich und Unterstrich enthalten."
      );
    });

    it("checks that emailPrefix is set", () => {
      expect(result({ emailPrefix: null })).to.contain("Präfix für E-Mails ist ein Pflichtfeld.");
      expect(result({ emailPrefix: "nn" })).to.not.contain("Präfix für E-Mails ist ein Pflichtfeld.");
    });

    it("checks that emailPrefix is longer than 5 and shorter than 15 letters", () => {
      expect(result({ emailPrefix: null })).to.contain(
        "Präfix für E-Mails muss mindestens 5 und höchstens 15 Zeichen enthalten."
      );
      expect(result({ emailPrefix: "n" })).to.contain(
        "Präfix für E-Mails muss mindestens 5 und höchstens 15 Zeichen enthalten."
      );
      expect(result({ emailPrefix: "nnnnn" })).to.not.contain(
        "Präfix für E-Mails muss mindestens 5 und höchstens 15 Zeichen enthalten."
      );
      expect(result({ emailPrefix: "123456789012345" })).to.not.contain(
        "Präfix für E-Mails muss mindestens 5 und höchstens 15 Zeichen enthalten."
      );
      expect(result({ emailPrefix: "123456789012345+" })).to.contain(
        "Präfix für E-Mails muss mindestens 5 und höchstens 15 Zeichen enthalten."
      );
    });

    it("checks that emailPrefix can contain chars, numbers, dash and blanks", () => {
      expect(result({ emailPrefix: "abc123ABC-" })).to.not.contain(
        "Präfix für E-Mails darf nur Zahlen, Buchstaben, Leerzeichen und Bindestriche enthalten."
      );
      expect(result({ emailPrefix: "ä" })).to.contain(
        "Präfix für E-Mails darf nur Zahlen, Buchstaben, Leerzeichen und Bindestriche enthalten."
      );
      expect(result({ emailPrefix: "Ä" })).to.contain(
        "Präfix für E-Mails darf nur Zahlen, Buchstaben, Leerzeichen und Bindestriche enthalten."
      );
      expect(result({ emailPrefix: "ß" })).to.contain(
        "Präfix für E-Mails darf nur Zahlen, Buchstaben, Leerzeichen und Bindestriche enthalten."
      );
      expect(result({ emailPrefix: "%" })).to.contain(
        "Präfix für E-Mails darf nur Zahlen, Buchstaben, Leerzeichen und Bindestriche enthalten."
      );
      expect(result({ emailPrefix: "_" })).to.contain(
        "Präfix für E-Mails darf nur Zahlen, Buchstaben, Leerzeichen und Bindestriche enthalten."
      );
      expect(result({ emailPrefix: " " })).to.not.contain(
        "Präfix für E-Mails darf nur Zahlen, Buchstaben, Leerzeichen und Bindestriche enthalten."
      );
    });

    it("checks that longName is set", () => {
      expect(result({ longName: null })).to.contain("Titel ist ein Pflichtfeld.");
      expect(result({ longName: "nn" })).to.not.contain("Titel ist ein Pflichtfeld.");
    });

    it("checks that color is set", () => {
      expect(result({ color: null })).to.contain("Farbe ist ein Pflichtfeld.");
      expect(result({ color: "x" })).to.not.contain("Farbe ist ein Pflichtfeld.");
    });

    it("checks that description is set", () => {
      expect(result({ description: null })).to.contain("Beschreibung ist ein Pflichtfeld.");
      expect(result({ description: "nn" })).to.not.contain("Beschreibung ist ein Pflichtfeld.");
    });

    it("checks that type is set", () => {
      expect(result({ type: null })).to.contain("Gruppenart ist ein Pflichtfeld.");
      expect(result({ type: "n" })).to.not.contain("Gruppenart ist ein Pflichtfeld.");
    });
  });

  describe("isValidForMember", () => {
    const result = (object) => translateMessages(validation.isValidForMember(object));

    it("performs many checks simultaneously", () => {
      expect(result({}).length).to.equal(9);
    });

    it("checks that nickname is set", () => {
      expect(result({})).to.contain("Nickname ist ein Pflichtfeld.");
      expect(result({ nickname: null })).to.contain("Nickname ist ein Pflichtfeld.");
      expect(result({ nickname: "n" })).to.not.contain("Nickname ist ein Pflichtfeld.");
    });

    it('checks that nickname does not contain a "/"', () => {
      expect(result({ nickname: "/" })).to.contain('Nickname darf kein "/" enthalten.');
    });

    it("checks that nickname is longer than 2 letters", () => {
      expect(result({ nickname: null })).to.contain("Nickname muss mindestens 2 Zeichen enthalten.");
      expect(result({ nickname: "n" })).to.contain("Nickname muss mindestens 2 Zeichen enthalten.");
      expect(result({ nickname: "nn" })).to.not.contain("Nickname muss mindestens 2 Zeichen enthalten.");
    });

    it("checks that firstname is set", () => {
      expect(result({ firstname: null })).to.contain("Vorname ist ein Pflichtfeld.");
      expect(result({ firstname: "nn" })).to.not.contain("Vorname ist ein Pflichtfeld.");
    });

    it("checks that lastname is set", () => {
      expect(result({ lastname: null })).to.contain("Nachname ist ein Pflichtfeld.");
      expect(result({ lastname: "nn" })).to.not.contain("Nachname ist ein Pflichtfeld.");
    });

    it("checks that email is set", () => {
      expect(result({})).to.contain("E-Mail ist ein Pflichtfeld.");
      expect(result({ email: null })).to.contain("E-Mail ist ein Pflichtfeld.");
      expect(result({ email: "n" })).to.not.contain("E-Mail ist ein Pflichtfeld.");
    });

    it("checks that email is valid", () => {
      expect(result({ email: null })).to.contain("E-Mail muss gültig sein.");
      expect(result({ email: "n" })).to.contain("E-Mail muss gültig sein.");
      expect(result({ email: "n@b" })).to.contain("E-Mail muss gültig sein.");
      expect(result({ email: "n@b.d" })).to.not.contain("E-Mail muss gültig sein.");
    });

    it("checks that location is set", () => {
      expect(result({ location: null })).to.contain("Ort / Region ist ein Pflichtfeld.");
      expect(result({ location: "nn" })).to.not.contain("Ort / Region ist ein Pflichtfeld.");
    });

    it("checks that reference is set", () => {
      expect(result({ reference: null })).to.contain("Wie ich von... ist ein Pflichtfeld.");
      expect(result({ reference: "nn" })).to.not.contain("Wie ich von... ist ein Pflichtfeld.");
    });

    it("checks that profession is set", () => {
      expect(result({ profession: null })).to.contain("Beruf ist ein Pflichtfeld.");
      expect(result({ profession: "nn" })).to.not.contain("Beruf ist ein Pflichtfeld.");
    });

    it("is array with no errors for a correct member", () => {
      const memberObject = {
        nickname: "nn",
        firstname: "nn",
        lastname: "nn",
        email: "n@b.d",
        location: "n",
        reference: "n",
        profession: "n",
        country: "c",
      };
      expect(result(memberObject).length).to.equal(0);
    });
  });

  describe("isValidMessage", () => {
    const result = (object) => validation.isValidMessage(object);

    it("performs many checks simultaneously", () => {
      expect(result({}).length).to.equal(2);
    });

    it("checks that subject is set", () => {
      expect(result({})).to.contain("Subject ist ein Pflichtfeld.");
      expect(result({ subject: null })).to.contain("Subject ist ein Pflichtfeld.");
      expect(result({ subject: "n" })).to.not.contain("Subject ist ein Pflichtfeld.");
    });

    it("checks that markdown is set", () => {
      expect(result({})).to.contain("HTML-Text ist ein Pflichtfeld.");
      expect(result({ markdown: null })).to.contain("HTML-Text ist ein Pflichtfeld.");
      expect(result({ markdown: "n" })).to.not.contain("HTML-Text ist ein Pflichtfeld.");
    });
  });
});
