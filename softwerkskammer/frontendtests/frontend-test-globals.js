var testglobals = {};
(function () {
  'use strict';

  function performAsXHR(field, value, requestChecker) {
    var requests = [];
    var xhr = sinon.useFakeXMLHttpRequest();
    xhr.onCreate = function (request) {
      requests.push(request);
    };
    field.val(value || 'value');
    field.trigger('change'); // triggers validation

    requestChecker(requests[0]);
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

  testglobals.checkFieldWithPositiveAjaxResponse = function (validator, field, value, urlRegexp) {
    performAsXHR(field, value, function (request) {
      request.respond(200, { 'Content-Type': 'text/plain' }, 'true');

      expect(validator.element(field)).to.be(true);
      expect(validator.errorList).to.be.empty();
      expect(request.url).to.match(urlRegexp);
    });
  };

  testglobals.checkFieldWithNegativeAjaxResponse = function (validator, field, message, value, urlRegexp) {
    performAsXHR(field, value, function (request) {
      request.respond(200, { 'Content-Type': 'text/plain' }, 'false');

      expect(validator.element(field)).to.be(false);
      expect(validator.errorList[0]).to.have.ownProperty('message', message);
      expect(request.url).to.match(urlRegexp);
    });
  };

  testglobals.checkThatPreviousValueIsSent = function (field, previousField, value) {
    previousField.val('previous');
    performAsXHR(field, value, function (request) {
      expect(request.url).to.match('&' + previousField[0].name + '=previous');
    });
  };

}());
