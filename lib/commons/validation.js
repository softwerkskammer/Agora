"use strict";

// DO NOT FORGET TO KEEP THIS FILE IN SYNC WITH /public/clientscripts/check-memberform.js
// AND /public/clientscripts/check-groupform.js
// AND /public/clientscripts/check-activityform.js
// AND /public/clientscripts/check-announcementform.js

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
    validator.check(member.firstname, 'Vorname ist ein Pflichtfeld.').notEmpty();
    validator.check(member.lastname, 'Nachname ist ein Pflichtfeld.').notEmpty();
    validator.check(member.email, 'E-Mail ist ein Pflichtfeld.').notEmpty();
    validator.check(member.email, 'E-Mail muss gültig sein.').isEmail();
    validator.check(member.location, 'Ort / Region ist ein Pflichtfeld.').notEmpty();
    validator.check(member.reference, 'Wie ich von... ist ein Pflichtfeld.').notEmpty();
    validator.check(member.profession, 'Beruf ist ein Pflichtfeld.').notEmpty();
    return validator.getErrors();
  },

  isValidGroup: function (group) {
    var validator = new Validator();
    validator.check(group.id, 'Name ist ein Pflichtfeld.').notEmpty();
    validator.check(group.id, 'Name muss mindestens 2 und höchstens 20 Zeichen enthalten.').len(2, 20);
    validator.check(group.id, 'Name darf nur Buchstaben, Zahlen, Bindestrich und Unterstrich enthalten.').regex(/^[\w-]+$/i);
    validator.check(group.emailPrefix, 'Präfix für E-Mails ist ein Pflichtfeld.').notEmpty();
    validator.check(group.emailPrefix, 'Präfix für E-Mails muss mindestens 5 und höchstens 15 Zeichen enthalten.').len(5, 15);
    validator.check(group.emailPrefix, 'Präfix für E-Mails darf nur Zahlen, Buchstaben, Leerzeichen und Bindestriche enthalten.').regex(/^[a-z0-9 -]+$/i);
    validator.check(group.longName, 'Titel ist ein Pflichtfeld.').notEmpty();
    validator.check(group.description, 'Beschreibung ist ein Pflichtfeld.').notEmpty();
    validator.check(group.type, 'Gruppenart ist ein Pflichtfeld.').notEmpty();
    return validator.getErrors();
  },

  isValidActivity: function (activity, checkDates) {
    var validator = new Validator();
    validator.check(activity.url, 'URL ist ein Pflichtfeld.').notEmpty();
    validator.check(activity.title, 'Titel ist ein Pflichtfeld.').notEmpty();
    validator.check(activity.location, 'Veranstaltungsort ist ein Pflichtfeld.').notEmpty();
    validator.check(activity.startDate(), 'Startdatum ist ein Pflichtfeld.').notEmpty();
    validator.check(activity.startTime(), 'Startuhrzeit ist ein Pflichtfeld.').notEmpty();
    if (checkDates && activity.startUnix >= activity.endUnix) {
      validator.error('Start muss vor Ende liegen.');
    }
    return validator.getErrors();
  },

  isValidAnnouncement: function (announcement) {
    var validator = new Validator();
    validator.check(announcement.title, 'Titel ist ein Pflichtfeld.').notEmpty();
    validator.check(announcement.url, 'URL ist ein Pflichtfeld.').notEmpty();
    validator.check(announcement.thruUnix, '"Anzeigen bis einschliesslich" ist ein Pflichtfeld.').notEmpty();
    return validator.getErrors();
  },

  isValidMessage: function (message) {
    var validator = new Validator();
    validator.check(message.subject, 'Subject ist ein Pflichtfeld.').notEmpty();
    validator.check(message.markdown, 'HTML-Text ist ein Pflichtfeld.').notEmpty();
    return validator.getErrors();
  }
};
