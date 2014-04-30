/*global member_validator, nicknameIsNotAvailable */
(function () {
  "use strict";

  // mocking the ajax request
  $.mockjax({
    url: "/members/checknickname",
    response: function (formdata) {
      this.responseText = "true";
      if ($.inArray(formdata.data.nickname, ["Nick", "Nack"]) !== -1) {
        this.responseText = "false";
      }
    },
    responseTime: 50,
    logging: false
  });

  test("A nickname 'NochNichtVorhanden' is valid", 2, function () {
    var nickname = $("#memberform [name=nickname]");
    stop();
    nickname.val("NochNichtVorhanden");
    // trigger validation
    nickname.trigger("change");
    $(document).ajaxStop(function () {
      $(document).unbind("ajaxStop");
      equal(member_validator.element(nickname), true);
      deepEqual(member_validator.errorList, []);
      start();
    });
  });

  test("Nickname is mandatory and must have at least two letters", 4, function () {
    var nickname = $("#memberform [name=nickname]");
    nickname.val("");
    equal(member_validator.element(nickname), false);
    equal(member_validator.errorList[0].message, 'Dieses Feld ist ein Pflichtfeld.');
    nickname.val("a");
    equal(member_validator.element(nickname), false);
    equal(member_validator.errorList[0].message, 'Geben Sie bitte mindestens 2 Zeichen ein.');
  });

  test("Nickname checking via Ajax is triggered", 2, function () {
    var nickname = $("#memberform [name=nickname]");
    stop();
    nickname.val("Nick");
    nickname.trigger("change");
    $(document).ajaxStop(function () {
      $(document).unbind("ajaxStop");
      equal(member_validator.element(nickname), false);
      equal(member_validator.errorList[0].message, nicknameIsNotAvailable);
      start();
    });
  });

  var checkFieldMandatory = function (fieldname) {
    var field = $(fieldname);
    field.val("");
    equal(member_validator.element(field), false);
    equal(member_validator.errorList[0].message, 'Dieses Feld ist ein Pflichtfeld.');
    field.val("a");
    equal(member_validator.element(field), true);
  };

  test("Firstname is mandatory", 3, function () {
    checkFieldMandatory("#memberform [name=firstname]");
  });

  test("Lastname is mandatory", 3, function () {
    checkFieldMandatory("#memberform [name=lastname]");
  });

  test("Location is mandatory", 3, function () {
    checkFieldMandatory("#memberform [name=location]");
  });

  test("Reference is mandatory", 3, function () {
    checkFieldMandatory("#memberform [name=reference]");
  });

  test("Profession is mandatory", 3, function () {
    checkFieldMandatory("#memberform [name=profession]");
  });
}());
