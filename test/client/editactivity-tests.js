/* global test, $, equal, activity_validator, initValidator */
"use strict";

var checkFieldMandatory = function (fieldname) {
  initValidator();
  var field = $(fieldname);
  field.val("");
  equal(activity_validator.element(field), false);
  equal(activity_validator.errorList[0].message, 'Dieses Feld ist ein Pflichtfeld.');

  field.val("a");
  equal(activity_validator.element(field), true);
};

test("Title is mandatory", 3, function () {
  checkFieldMandatory("#title");
});

test("Location is mandatory", 3, function () {
  checkFieldMandatory("#location");
});

test("activityDate is a text field and mandatory", 3, function () {
  checkFieldMandatory("#activityDate");
});
