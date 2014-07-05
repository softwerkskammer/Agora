/*global addon_validator */
(function () {
  'use strict';

  describe('Addon Form', function () {

    var checkFieldMandatory = function (fieldname, optionalValue) {
      testglobals.mandatoryChecker(addon_validator, fieldname, optionalValue);
    };

    it('checks that "homeAddress" is mandatory', function () {
      checkFieldMandatory('#addonform [name=homeAddress]');
    });

    it('checks that "billingAddress" is mandatory', function () {
      checkFieldMandatory('#addonform [name=billingAddress]');
    });

    it('checks that "tShirtSize" is mandatory', function () {
      checkFieldMandatory('#addonform [name=tShirtSize]', 'S');
    });

  });
}());
