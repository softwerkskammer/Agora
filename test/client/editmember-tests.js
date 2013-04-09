/* global test, $, equal, deepEqual, member_validator, initValidator, stop, start, document */
"use strict";

// mocking the ajax request
$.mockjax({
  url: "/members/checknickname",
  response: function (formdata) {
    var nick = formdata.data.nickname.trim(),
      nicknames = ["Nick", "Nack"];
    this.responseText = "true";
    if ($.inArray(nick, nicknames) !== -1) {
      this.responseText = "false";
    }
  },
  responseTime: 50
});

test("A nickname 'NochNichtVorhanden' is valid", 2, function () {
  initValidator();
  var nickname = $("#nickname");
  stop();
  nickname.val("NochNichtVorhanden");
  // trigger validation
  member_validator.element(nickname);
  $(document).ajaxStop(function () {
    $(document).unbind("ajaxStop");
    equal(member_validator.element(nickname), true);
    deepEqual(member_validator.errorList, []);
    start();
  });
});

test("Nickname is mandatory and must have at least two letters", 4, function () {
  initValidator();
  var nickname = $("#nickname");
  nickname.val("");
  equal(member_validator.element(nickname), false);
  equal(member_validator.errorList[0].message, 'Dieses Feld ist ein Pflichtfeld.');
  nickname.val("a");
  equal(member_validator.element(nickname), false);
  equal(member_validator.errorList[0].message, 'Geben Sie bitte mindestens 2 Zeichen ein.');
});

test("Nickname checking via Ajax is triggered", 3, function () {
  initValidator();
  var nickname = $("#nickname");
  member_validator.element(nickname);
  stop();
  nickname.val("Nick");
  equal(member_validator.element(nickname), true);
  $(document).ajaxStop(function () {
    $(document).unbind("ajaxStop");
    equal(member_validator.element(nickname), false);
    equal(member_validator.errorList[0].message, 'Dieser Nickname ist leider nicht verfügbar.');
    start();
  });
});

var checkFieldMandatory = function (fieldname) {
  initValidator();
  var field = $(fieldname);
  field.val("");
  equal(member_validator.element(field), false);
  equal(member_validator.errorList[0].message, 'Dieses Feld ist ein Pflichtfeld.');
  field.val("a");
  equal(member_validator.element(field), true);
};

test("Firstname is mandatory", 3, function () {
  checkFieldMandatory("#firstname");
});

test("Lastname is mandatory", 3, function () {
  checkFieldMandatory("#lastname");
});

test("Location is mandatory", 3, function () {
  checkFieldMandatory("#location");
});

test("Reference is mandatory", 3, function () {
  checkFieldMandatory("#reference");
});

test("Profession is mandatory", 3, function () {
  checkFieldMandatory("#profession");
});

