"use strict";

// DO NOT FORGET TO KEEP THIS FILE IN SYNC WITH /public/clientscripts/check-memberform.js

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
    validator.check(member.nickname, 'Nickname ist ein Pflichtfeld und muss mindestens 2 Zeichen enthalten.').notEmpty().len(2);
    validator.check(member.firstname, 'Vorname ist ein Pflichtfeld.').notEmpty();
    validator.check(member.lastname, 'Nachname ist ein Pflichtfeld.').notEmpty();
    validator.check(member.email, 'Email ist ein Pflichtfeld und muss gültig sein.').notEmpty().isEmail();
    validator.check(member.location, 'Ort / Region ist ein Pflichtfeld.').notEmpty();
    validator.check(member.reference, 'Wie ich von... ist ein Pflichtfeld.').notEmpty();
    validator.check(member.profession, 'Beruf ist ein Pflichtfeld.').notEmpty();
    return validator.getErrors();
  }
};
