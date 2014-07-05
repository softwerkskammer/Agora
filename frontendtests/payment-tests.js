/*global addon_validator */
(function () {
  'use strict';

  describe('Payment Form', function () {
    var checkFieldMandatory = function (fieldname) {
      var field = $(fieldname);
      field.val('');
      expect(addon_validator.element(field)).to.be(false);
      expect(addon_validator.errorList[0].message).to.be('Dieses Feld ist ein Pflichtfeld.');
      field.val('a');
      expect(addon_validator.element(field)).to.be(true);
    };

    it('checks that "description" is mandatory', function () {
      checkFieldMandatory('#paymentform [name=description]');
    });

    it('checks that "amount" is mandatory', function () {
      checkFieldMandatory('#paymentform [name=amount]');
    });

  });
}());
