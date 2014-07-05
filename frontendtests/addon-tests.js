/*global addon_validator */
(function () {
  'use strict';

  describe('Addon Form', function () {

    var checkFieldMandatory = function (fieldname) {
      var field = $(fieldname);
      field.val('');
      expect(addon_validator.element(field)).to.be(false);
      expect(addon_validator.errorList[0].message).to.be('Dieses Feld ist ein Pflichtfeld.');
      field.val('S'); // to make it select a t-shirt size
      expect(addon_validator.element(field)).to.be(true);
    };

    it('checks that "homeAddress" is mandatory', function () {
      checkFieldMandatory('#addonform [name=homeAddress]');
    });

    it('checks that "billingAddress" is mandatory', function () {
      checkFieldMandatory('#addonform [name=billingAddress]');
    });

    it('checks that "tShirtSize" is mandatory', function () {
      checkFieldMandatory('#addonform [name=tShirtSize]');
    });

  });
}());
