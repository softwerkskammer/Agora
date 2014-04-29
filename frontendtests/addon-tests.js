/*global addon_validator */
(function () {
  "use strict";

  var checkFieldMandatory = function (fieldname) {
    var field = $(fieldname);
    field.val("");
    equal(addon_validator.element(field), false);
    equal(addon_validator.errorList[0].message, 'Dieses Feld ist ein Pflichtfeld.');
    field.val("a");
    equal(addon_validator.element(field), true);
  };

  test("HomeAddress is mandatory", 3, function () {
    checkFieldMandatory("#homeAddress");
  });

  test("BillingAddress is mandatory", 3, function () {
    checkFieldMandatory("#billingAddress");
  });

  test("T-Shirt-Size is mandatory", 3, function () {
    checkFieldMandatory("#tShirtSize");
  });

  test("Roommate is not mandatory", 1, function () {
    var field = $("#roommate");
    field.val("");
    equal(addon_validator.element(field), true);
  });
}());
