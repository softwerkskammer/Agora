const beans = require("simple-configure").get("beans");
const misc = beans.get("misc");
const fieldHelpers = beans.get("fieldHelpers");

// DO NOT FORGET TO KEEP THIS FILE IN SYNC WITH /public/clientscripts/check-memberform.js
// AND /public/clientscripts/check-groupform.js
// AND /public/clientscripts/check-activityform.js

const Validator = require("./internal/validationHelper");

function checkCommonMemberFields(validator, memberInput) {
  validator.check(memberInput.nickname, "validation.nickname_required").notEmpty();
  validator.check(memberInput.nickname, "validation.nickname_min_2_chars").len(2);
  validator.check(memberInput.nickname, "validation.nickname_no_slash").noSlash();
  validator.check(memberInput.firstname, "validation.firstname_required").notEmpty();
  validator.check(memberInput.lastname, "validation.lastname_required").notEmpty();
  validator.check(memberInput.email, "validation.email_required").notEmpty();
  validator.check(memberInput.email, "validation.email_valid").isEmail();
}

module.exports = {
  checkValidity: function checkValidity(oldValue, newValue, checkFunction, errorMessage, callback) {
    if (newValue !== oldValue) {
      return checkFunction(newValue, (err, check) => {
        if (err || !check) {
          return callback(null, errorMessage);
        }
        return callback(null);
      });
    }
    return callback(null);
  },

  isValidForMember: function isValidForMember(memberInput) {
    const validator = new Validator();
    checkCommonMemberFields(validator, memberInput);
    validator.check(memberInput.location, "validation.city_required").notEmpty();
    validator.check(memberInput.reference, "validation.reference_required").notEmpty();
    validator.check(memberInput.profession, "validation.profession_required").notEmpty();
    return validator.getErrors();
  },

  isValidGroup: function isValidGroup(group) {
    const validator = new Validator();
    validator.check(group.id, "Name ist ein Pflichtfeld.").notEmpty();
    validator.check(group.id, "Name muss mindestens 2 und höchstens 20 Zeichen enthalten.").len(2, 20);
    validator
      .check(group.id, "Name darf nur Buchstaben, Zahlen, Bindestrich und Unterstrich enthalten.")
      .regex(/^[\w-]+$/i);
    validator.check(group.emailPrefix, "Präfix für E-Mails ist ein Pflichtfeld.").notEmpty();
    validator
      .check(group.emailPrefix, "Präfix für E-Mails muss mindestens 5 und höchstens 15 Zeichen enthalten.")
      .len(5, 15);
    validator
      .check(
        group.emailPrefix,
        "Präfix für E-Mails darf nur Zahlen, Buchstaben, Leerzeichen und Bindestriche enthalten."
      )
      .regex(/^[a-z0-9 -]+$/i);
    validator.check(group.longName, "Titel ist ein Pflichtfeld.").notEmpty();
    validator.check(group.color, "Farbe ist ein Pflichtfeld.").notEmpty();
    validator.check(group.description, "Beschreibung ist ein Pflichtfeld.").notEmpty();
    validator.check(group.type, "Gruppenart ist ein Pflichtfeld.").notEmpty();
    return validator.getErrors();
  },

  isValidForActivity: function isValidForActivity(activityInput) {
    const validator = new Validator();
    const nonEmptyResourceLimits = activityInput.resources
      ? misc.compact(misc.toArray(activityInput.resources.limits))
      : [];

    validator.check(activityInput.url, "URL ist ein Pflichtfeld.").notEmpty();
    validator.check(activityInput.url, 'URL darf kein "/" enthalten.').noSlash();
    validator.check(activityInput.title, "Titel ist ein Pflichtfeld.").notEmpty();
    validator.check(activityInput.location, "Veranstaltungsort ist ein Pflichtfeld.").notEmpty();
    validator.check(activityInput.startDate, "Startdatum ist ein Pflichtfeld.").notEmpty();
    validator.check(activityInput.startTime, "Startuhrzeit ist ein Pflichtfeld.").notEmpty();
    validator.check(activityInput.endDate, "Endedatum ist ein Pflichtfeld.").notEmpty();
    validator.check(activityInput.endTime, "Enduhrzeit ist ein Pflichtfeld.").notEmpty();
    validator.check(activityInput.assignedGroup, "Gruppe ist ein Pflichtfeld.").notEmpty();
    nonEmptyResourceLimits.forEach((limit) =>
      validator.check(limit, "Die Ressourcenbeschränkungen dürfen nur aus Ziffern bestehen.").isInt()
    );

    const start = fieldHelpers.parseToDateTimeUsingDefaultTimezone(activityInput.startDate, activityInput.startTime);
    const end = fieldHelpers.parseToDateTimeUsingDefaultTimezone(activityInput.endDate, activityInput.endTime);

    if (start >= end) {
      validator.error("Start muss vor Ende liegen.");
    }

    return validator.getErrors();
  },

  isValidMessage: function isValidMessage(message) {
    const validator = new Validator();
    validator.check(message.subject, "Subject ist ein Pflichtfeld.").notEmpty();
    validator.check(message.markdown, "HTML-Text ist ein Pflichtfeld.").notEmpty();
    return validator.getErrors();
  },
};
