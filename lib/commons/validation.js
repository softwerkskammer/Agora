"use strict";

var _ = require('underscore');
var beans = require('nconf').get('beans');
var misc = beans.get('misc');
var fieldHelpers = beans.get('fieldHelpers');

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
  checkValidity: function (oldValue, newValue, checkFunction, errorMessage, callback) {
    if (newValue !== oldValue) {
      return checkFunction(newValue, function (err, check) {
        if (err || !check) {
          return callback(null, errorMessage);
        }
        return callback(null);
      });
    }
    return callback(null);
  },

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

  isValidForActivity: function (activityInput) {
    var validator = new Validator();
    var nonEmptyResourceNames = activityInput.resources ? _.compact(misc.toArray(activityInput.resources.names)) : [];
    var nonEmptyResourceLimits = activityInput.resources ? _.compact(misc.toArray(activityInput.resources.limits)) : [];

    validator.check(activityInput.url, 'URL ist ein Pflichtfeld.').notEmpty();
    validator.check(activityInput.title, 'Titel ist ein Pflichtfeld.').notEmpty();
    validator.check(activityInput.location, 'Veranstaltungsort ist ein Pflichtfeld.').notEmpty();
    validator.check(activityInput.startDate, 'Startdatum ist ein Pflichtfeld.').notEmpty();
    validator.check(activityInput.startTime, 'Startuhrzeit ist ein Pflichtfeld.').notEmpty();
    validator.check(activityInput.endDate, 'Endedatum ist ein Pflichtfeld.').notEmpty();
    validator.check(activityInput.endTime, 'Enduhrzeit ist ein Pflichtfeld.').notEmpty();
    _.each(nonEmptyResourceLimits, function (limit) { validator.check(limit, 'Die Ressourcenbeschränkungen dürfen nur aus Ziffern bestehen.').isInt(); });

    if (nonEmptyResourceNames.length === 0) {
      validator.error('Es muss mindestens eine Ressourcenbezeichnung angegeben werden.');
    }
    if (nonEmptyResourceNames.length !== _.uniq(nonEmptyResourceNames).length) {
      validator.error('Die Bezeichnungen der Ressourcen müssen eindeutig sein.');
    }

    var startUnix = fieldHelpers.parseToUnixUsingDefaultTimezone(activityInput.startDate, activityInput.startTime);
    var endUnix = fieldHelpers.parseToUnixUsingDefaultTimezone(activityInput.endDate, activityInput.endTime);

    if (startUnix >= endUnix) {
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
