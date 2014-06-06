/*global addon_validator */
(function () {
  'use strict';

  describe('Payment Form', function () {
    var checkFieldMandatory = function (fieldname) {
      var field = $(fieldname);
      field.val('');
      expect(addon_validator.element(field)).toBe(false);
      expect(addon_validator.errorList[0].message).toBe('Dieses Feld ist ein Pflichtfeld.');
      field.val('a');
      expect(addon_validator.element(field)).toBe(true);
    };

    beforeEach(function (done) {
      $(function () { done(); }); // just to wait for the form to be loaded
    })

    it('checks that "description" is mandatory', function () {
      checkFieldMandatory('#paymentform [name=description]');
    });

    it('checks that "amount" is mandatory', function () {
      checkFieldMandatory('#paymentform [name=amount]');
    });

  });
}());
