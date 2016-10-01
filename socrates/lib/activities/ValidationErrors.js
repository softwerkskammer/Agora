'use strict';

function ValidationErrors(errors) {
  this.errors = errors;
}

ValidationErrors.prototype = Object.create(Error.prototype);
ValidationErrors.prototype.constructor = ValidationErrors;
ValidationErrors.prototype.name = 'ValidationErrors';
ValidationErrors.prototype.message = 'Validation Errors';

module.exports = ValidationErrors;
