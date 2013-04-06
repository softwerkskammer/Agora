/* global test, $, equal */
"use strict";

test("nickname value", 1, function () {
  var nickname = $("#nickname");
  equal(nickname.val(), '');
});

test("firstname value", 1, function () {
  var firstname = $("#firstname");
  equal(firstname.val(), '');
});

test("lastname value", 1, function () {
  var lastname = $("#lastname");
  equal(lastname.val(), '');
});