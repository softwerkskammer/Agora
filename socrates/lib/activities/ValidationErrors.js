'use strict';

class ValidationErrors extends Error {
  constructor(errors) {
    super();
    this.errors = errors;
    this.name = 'ValidationErrors';
    this.message = 'Validation Errors';
  }
}

module.exports = ValidationErrors;
