/*global activity_validator, endMustBeAfterBegin */
(function () {
  "use strict";

  var checkFieldMandatory = function (fieldname) {
    var field = $(fieldname);
    field.val("");
    field.trigger("change");
    equal(activity_validator.element(field), false);
    equal(activity_validator.errorList[0].message, 'Dieses Feld ist ein Pflichtfeld.');
    field.val("a");

    equal(activity_validator.element(field), true);
  };
  test("Title is mandatory", 3, function () {
    checkFieldMandatory("#activityform [name=title]");
  });

  test("Location is mandatory", 3, function () {
    checkFieldMandatory("#activityform [name=location]");
  });

  test("startDate is a text field and mandatory", 3, function () {
    checkFieldMandatory("#activityform [name=startDate]");
  });

  test("startTime is a text field and mandatory", 3, function () {
    checkFieldMandatory("#activityform [name=startTime]");
  });

  test("start and end must not be identical", 3, function () {
    $("#activityform [name=startDate]").val("23.09.2011");
    $("#activityform [name=endDate]").val("23.09.2011");
    $("#activityform [name=startTime]").val("12:11");
    $("#activityform [name=endTime]").val("12:11");
    $("#activityform [name=startTime]").trigger("change");

    equal(activity_validator.element("#activityform [name=endDate]"), false);
    equal(activity_validator.element("#activityform [name=endTime]"), false);
    equal(activity_validator.errorList[0].message, endMustBeAfterBegin);
  });

}());
