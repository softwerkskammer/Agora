/*eslint no-control-regex: "off"*/

const fieldHelpers = require('simple-configure').get('beans').get('fieldHelpers');

// shamelessly taken from jquery.validate
const emailPattern = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;

// shamelessly taken from node-validator
const intPattern = /^(?:-?(?:0|[1-9][0-9]*))$/;

class Validator {
  constructor() {
    this.errors = [];
  }

  error(err) {
    this.errors.push(err || this.message);
  }

  getErrors() {
    return this.errors;
  }

  check(string, message) {
    this.string = string;
    this.message = message;
    return this;
  }

  notEmpty() {
    if (!fieldHelpers.isFilled(this.string)) {
      this.error();
    }
  }

  len(minLen, maxLen) {
    if (!fieldHelpers.isFilled(this.string) || this.string.length < minLen) {
      return this.error();
    }
    if (maxLen && this.string.length > maxLen) {
      this.error();
    }
  }

  isEmail() {
    if (!emailPattern.test(this.string)) {
      this.error();
    }
  }

  isInt() {
    if (!intPattern.test(this.string)) {
      this.error();
    }
  }

  regex(regex) {
    if (!this.string || !this.string.match(regex)) {
      this.error();
    }
  }

  noSlash() {
    if (fieldHelpers.containsSlash(this.string)) {
      this.error();
    }
  }
}

module.exports = Validator;
