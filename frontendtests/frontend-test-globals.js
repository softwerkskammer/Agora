var testglobals = {};
(function () {
  'use strict';
  testglobals.mandatoryChecker = function (validator, fieldname, optionalValue) {
    var field = $(fieldname);
    field.val('');
    expect(validator.element(field)).to.be(false);
    expect(validator.errorList[0].message).to.be('Dieses Feld ist ein Pflichtfeld.');
    field.val(optionalValue || 'aa');
    expect(validator.element(field)).to.be(true);
  };
}());
