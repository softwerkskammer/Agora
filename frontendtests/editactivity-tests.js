/* global test, $, equal, activity_validator, initValidator */
"use strict";

var checkFieldMandatory = function (fieldname) {
  initValidator();
  var field = $(fieldname);
  field.val("");
  field.trigger("change");
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

test("startDate is a text field and mandatory", 3, function () {
  checkFieldMandatory("#startDate");
});

test("startTime is a text field and mandatory", 3, function () {
  checkFieldMandatory("#startTime");
});

test("start and end must not be identical", 3, function () {
  initValidator();
  $("#startDate").val("23.09.2011");
  $("#endDate").val("23.09.2011");
  $("#startTime").val("12:11");
  $("#endTime").val("12:11");
  $("#startTime").trigger("change");

  equal(activity_validator.element("#endDate"), false);
  equal(activity_validator.element("#endTime"), false);
  equal(activity_validator.errorList[0].message, 'Das Ende muss gefüllt sein und nach dem Beginn liegen.');

});