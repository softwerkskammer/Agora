var testglobals = {};
(function () {
  'use strict';
  testglobals.mandatoryChecker = function (validator, selector, optionalValue) {
    var field = $(selector);
    field.val('');
    expect(validator.element(field)).to.be(false);
    expect(validator.errorList[0].message).to.be('Dieses Feld ist ein Pflichtfeld.');
    field.val(optionalValue || 'aa');
    expect(validator.element(field)).to.be(true);
  };

  testglobals.checkFieldWithPositiveAjaxResponse = function (sandbox, validator, field, value) {
    sandbox.stub($, 'ajax').yieldsTo('success', true);
    field.val(value || 'value');
    // trigger validation
    field.trigger('change');

    expect(validator.element(field)).to.be(true);
    expect(validator.errorList).to.be.empty();
  };

  testglobals.checkFieldWithNegativeAjaxResponse = function (sandbox, validator, field, message, value) {
    sandbox.stub($, 'ajax').yieldsTo('success', false);
    field.val(value || 'value');
    // trigger validation
    field.trigger('change');

    expect(validator.element(field)).to.be(false);
    expect(validator.errorList[0]).to.have.ownProperty('message', message);
  };

  testglobals.checkThatPreviousValueIsSent = function (sandbox, field, previousField, value) {
    var spy = sandbox.spy($, 'ajax');
    previousField.val('previous');
    field.val(value || 'test');
    // trigger validation
    field.trigger('change');
    expect(spy.args[0][0].data[previousField[0].name]()).to.equal('previous');
  };

}());
