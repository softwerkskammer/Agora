/*global addon_validator, testglobals */
(function () {
  'use strict';

  describe('Payment Form', function () {
    var checkFieldMandatory = function (selector) {
      testglobals.mandatoryChecker(addon_validator, selector);
    };

    it('checks that "description" is mandatory', function () {
      checkFieldMandatory('#paymentform [name=description]');
    });

    it('checks that "amount" is mandatory', function () {
      checkFieldMandatory('#paymentform [name=amount]');
    });

  });
}());
