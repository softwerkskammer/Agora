"use strict";

// DO NOT FORGET TO KEEP THIS FILE IN SYNC WITH /public/clientscripts/check-memberform.js
// AND /public/clientscripts/check-groupform.js

var Validator = require('validator').Validator;
Validator.prototype.error = function (msg) {
  this._errors.push(msg);
  return this;
};

Validator.prototype.getErrors = function () {
  return this._errors;
};

module.exports = {
  isValidMember: function (member) {
    var validator = new Validator();
    validator.check(member.nickname, 'Nickname ist ein Pflichtfeld.').notEmpty();
    validator.check(member.nickname, 'Nickname muss mindestens 2 Zeichen enthalten.').len(2);
    validator.check(member.nickname, 'Nickname darf nur Buchstaben, Zahlen und Unterstrich enthalten.').regex(/^\w+$/i);
    validator.check(member.firstname, 'Vorname ist ein Pflichtfeld.').notEmpty();
    validator.check(member.lastname, 'Nachname ist ein Pflichtfeld.').notEmpty();
    validator.check(member.email, 'Email ist ein Pflichtfeld.').notEmpty();
    validator.check(member.email, 'Email muss gültig sein.').isEmail();
    validator.check(member.location, 'Ort / Region ist ein Pflichtfeld.').notEmpty();
    validator.check(member.reference, 'Wie ich von... ist ein Pflichtfeld.').notEmpty();
    validator.check(member.profession, 'Beruf ist ein Pflichtfeld.').notEmpty();
    return validator.getErrors();
  },

  isValidGroup: function (group) {
    var validator = new Validator();
    validator.check(group.id, 'Name ist ein Pflichtfeld.').notEmpty();
    validator.check(group.id, 'Name muss mindestens 2 und höchstens 20 Zeichen enthalten.').len(2, 20);
    validator.check(group.id, 'Name darf nur Buchstaben, Zahlen und Unterstrich enthalten.').regex(/^\w+$/i);
    validator.check(group.emailPrefix, 'Präfix für Emails ist ein Pflichtfeld.').notEmpty();
    validator.check(group.emailPrefix, 'Präfix für Emails muss mindestens 5 und höchstens 15 Zeichen enthalten.').len(5, 15);
    validator.check(group.emailPrefix, 'Präfix für Emails darf nur alphanumerische Zeichen enthalten.').isAlphanumeric();
    validator.check(group.longName, 'Titel ist ein Pflichtfeld.').notEmpty();
    validator.check(group.description, 'Beschreibung ist ein Pflichtfeld.').notEmpty();
    validator.check(group.type, 'Gruppenart ist ein Pflichtfeld.').notEmpty();
    return validator.getErrors();
  },

  isValidActivity: function (activity) {
    var validator = new Validator();
    validator.check(activity.title, "Titel ist ein Pflichtfeld.").notEmpty();
    validator.check(activity.location, "Veranstaltungsort ist ein Pflichtfeld.").notEmpty();
    validator.check(activity.activityDate, "Datum ist ein Pflichtfeld.").notEmpty();
    return validator.getErrors();
  }
};
