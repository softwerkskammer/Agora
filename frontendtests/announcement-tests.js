/*global announcement_validator, urlIsNotAvailable */
(function () {
  "use strict";

  // mocking the ajax request
  $.mockjax({
    url: "/announcements/checkurl",
    response: function (formdata) {
      this.responseText = (formdata.data.url.trim() === "ann1") ? "true" : "false";
    },
    responseTime: 50,
    logging: false
  });

  test("A url 'ann1' is valid", 2, function () {
    var url = $("#url");
    stop();
    url.val("ann1");
    // trigger validation
    announcement_validator.element(url);
    $(document).ajaxStop(function () {
      $(document).unbind("ajaxStop");
      equal(announcement_validator.element(url), true);
      deepEqual(announcement_validator.errorList, []);
      start();
    });
  });

  test("A url 'NochNichtVorhanden' is valid", 2, function () {
    var url = $("#url");
    stop();
    url.val("NochNichtVorhanden");
    // trigger validation
    announcement_validator.element(url);
    $(document).ajaxStop(function () {
      $(document).unbind("ajaxStop");
      equal(announcement_validator.element(url), false);
      deepEqual(announcement_validator.errorList[0].message, urlIsNotAvailable);
      start();
    });
  });

  var checkFieldMandatory = function (fieldname) {
    var field = $(fieldname);
    field.val("");
    equal(announcement_validator.element(field), false);
    equal(announcement_validator.errorList[0].message, 'Dieses Feld ist ein Pflichtfeld.');
    field.val("a");
    equal(announcement_validator.element(field), true);
  };

  test("Title is mandatory", 3, function () {
    checkFieldMandatory("#title");
  });

  test("Url is mandatory", 3, function () {
    checkFieldMandatory("#url");
  });

  test("ThruDate is mandatory", 3, function () {
    checkFieldMandatory("#thruDate");
  });

}());
