'use strict';

var fieldHelpers = require('nconf').get('beans').get('fieldHelpers');

// shamelessly taken from jquery.validate
var emailPattern = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;

// shamelessly taken from node-validator
var intPattern = /^(?:-?(?:0|[1-9][0-9]*))$/;

var Validator = function () {
  this.errors = [];
};

Validator.prototype.error = function (err) {
  this.errors.push(err || this.message);
};

Validator.prototype.getErrors = function () {
  return this.errors;
};

Validator.prototype.check = function (string, message) {
  this.string = string;
  this.message = message;
  return this;
};

Validator.prototype.notEmpty = function () {
  if (!fieldHelpers.isFilled(this.string)) {
    this.error();
  }
};

Validator.prototype.len = function (minLen, maxLen) {
  if (!fieldHelpers.isFilled(this.string) || this.string.length < minLen) {
    return this.error();
  }
  if (maxLen && this.string.length > maxLen) {
    this.error();
  }
};

Validator.prototype.isEmail = function () {
  if (!emailPattern.test(this.string)) {
    this.error();
  }
};

Validator.prototype.isInt = function () {
  if (!intPattern.test(this.string)) {
    this.error();
  }
};

Validator.prototype.regex = function (regex) {
  if (!this.string || !this.string.match(regex)) {
    this.error();
  }
};

module.exports = Validator;
