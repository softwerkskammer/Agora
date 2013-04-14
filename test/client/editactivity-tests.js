/* global test, $, equal, activity_validator, initValidator */
"use strict";

var checkFieldMandatory = function (fieldname, fieldtype) {
  initValidator();
  var field = $(fieldname);
  field.val("");
  equal(activity_validator.element(field), false);
  equal(activity_validator.errorList[0].message, 'Dieses Feld ist ein Pflichtfeld.');

  field.val("a");
  if (fieldtype === "date") {
    // be cautious, this is an us format of the date, otherwise the validator will not work
    // correctly
    field.val("1212/12/12");
  }
  equal(activity_validator.element(field), true);
};

test("Title is mandatory", 3, function () {
  checkFieldMandatory("#title");
});

test("Location is mandatory", 3, function () {
  checkFieldMandatory("#location");
});

test("activityDate is a date field and mandatory", 3, function () {
  checkFieldMandatory("#activityDate", "date");
});