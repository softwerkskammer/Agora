/* global test, $, equal, member_validator, initValidator, stop, start, document */
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

test("nickname empty or less than two letters", 2, function () {
  var nickname = $("#nickname");
  nickname.val("");
  equal(member_validator.element(nickname), false);
  nickname.val("a");
  equal(member_validator.element(nickname), false);
});

test("nickname already taken", 2, function () {
  initValidator();
  var nickname = $("#nickname");
  member_validator.element(nickname);
  stop();
  nickname.val("Nick");
  equal(member_validator.element(nickname), true);
  $(document).ajaxStop(function () {
    $(document).unbind("ajaxStop");
    equal(member_validator.element(nickname), false);
    start();
  });
});

test("firstname value", 1, function () {
  var firstname = $("#firstname");
  equal(firstname.val(), '');
});

test("lastname value", 1, function () {
  var lastname = $("#lastname");
  equal(lastname.val(), '');
});