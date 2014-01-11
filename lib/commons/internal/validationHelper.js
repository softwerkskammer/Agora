"use strict";

var fieldHelpers = require('nconf').get('beans').get('fieldHelpers');

var validator = require('validator');

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
  if (!validator.isEmail(this.string)) {
    this.error();
  }
};

Validator.prototype.isInt = function () {
  if (!validator.isInt(this.string)) {
    this.error();
  }
};

Validator.prototype.regex = function (regex) {
  if (!this.string || !this.string.match(regex)) {
    this.error();
  }
};

module.exports = Validator;
