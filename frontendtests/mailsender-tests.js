/*global mail_validator */
(function () {
  "use strict";

  var checkFieldMandatory = function (fieldname) {
    var field = $(fieldname);
    field.val("");
    equal(mail_validator.element(field), false);
    equal(mail_validator.errorList[0].message, 'Dieses Feld ist ein Pflichtfeld.');
    field.val("a");
    equal(mail_validator.element(field), true);
  };

  test("Subject is mandatory", 3, function () {
    checkFieldMandatory("#mailform [name=subject]");
  });

  test("Markdown is mandatory", 3, function () {
    checkFieldMandatory("#mailform [name=markdown]");
  });

}());
