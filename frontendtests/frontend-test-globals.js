var testglobals = {};
(function () {
  'use strict';

  function performAsXHR(callback) {
    var requests = [];
    var xhr = sinon.useFakeXMLHttpRequest();
    xhr.onCreate = function (xhr) {
      requests.push(xhr);
    };
    callback(requests);
    xhr.restore();
  }

  testglobals.mandatoryChecker = function (validator, selector, optionalValue) {
    var field = $(selector);
    field.val('');
    expect(validator.element(field)).to.be(false);
    expect(validator.errorList[0].message).to.be('Dieses Feld ist ein Pflichtfeld.');
    field.val(optionalValue || 'aa');
    expect(validator.element(field)).to.be(true);
  };

  testglobals.checkFieldWithPositiveAjaxResponse = function (validator, field, value) {
    performAsXHR(function (requests) {
      field.val(value || 'value');
      field.trigger('change'); // triggers validation

      requests[0].respond(200, { "Content-Type": "text/plain" }, 'true');

      expect(validator.element(field)).to.be(true);
      expect(validator.errorList).to.be.empty();
    });
  };

  testglobals.checkFieldWithNegativeAjaxResponse = function (validator, field, message, value) {
    performAsXHR(function (requests) {
      field.val(value || 'value');
      field.trigger('change'); // triggers validation

      requests[0].respond(200, { "Content-Type": "text/plain" }, 'false');

      expect(validator.element(field)).to.be(false);
      expect(validator.errorList[0]).to.have.ownProperty('message', message);
    });
  };

  testglobals.checkThatPreviousValueIsSent = function (field, previousField, value) {
    var spy = sinon.spy($, 'ajax');
    previousField.val('previous');
    field.val(value || 'test');
    // trigger validation
    field.trigger('change');
    expect(spy.args[0][0].data[previousField[0].name]()).to.equal('previous');
    spy.restore();
  };

}());
