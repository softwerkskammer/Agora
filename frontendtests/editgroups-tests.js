/* global test, $, equal, deepEqual, groups_validator, initValidator, stop, start, document */
"use strict";

// mocking the ajax request
$.mockjax({
  url: "/groups/checkgroupname",
  response: function (formdata) {
    var groupname = formdata.data.id.trim(),
      groupnames = ["groupa", "groupb"];
    this.responseText = "true";
    if ($.inArray(groupname, groupnames) !== -1) {
      this.responseText = "false";
    }
  },
  responseTime: 50
});

$.mockjax({
  url: "/groups/checkemailprefix",
  response: function (formdata) {
    var prefix = formdata.data.emailPrefix.trim(),
      groupnames = ["groupa", "groupb"];
    this.responseText = "true";
    if ($.inArray(prefix, groupnames) !== -1) {
      this.responseText = "false";
    }
  },
  responseTime: 50
});

test("A groupname 'NochNichtVorhanden' is valid", 2, function () {
  initValidator();
  var groupname = $("#id");
  stop();
  groupname.val("NochNichtVorhanden");
  // trigger validation
  groups_validator.element(groupname);
  $(document).ajaxStop(function () {
    $(document).unbind("ajaxStop");
    equal(groups_validator.element(groupname), true);
    deepEqual(groups_validator.errorList, []);
    start();
  });
});

test("A groupname 'groupa' is invalid", 3, function () {
  initValidator();
  var groupname = $("#id");
  groups_validator.element(groupname);
  stop();
  groupname.val("groupa");
  equal(groups_validator.element(groupname), true);
  $(document).ajaxStop(function () {
    $(document).unbind("ajaxStop");
    equal(groups_validator.element(groupname), false);
    equal(groups_validator.errorList[0].message, 'Dieser Gruppenname ist bereits vergeben.');
    start();
  });
});

test("A prefix less than 5 letters is invalid", 1, function () {
  initValidator();
  var prefix = $("#emailPrefix");
  prefix.val("Much");
  equal(groups_validator.element(prefix), false);
});

test("A prefix longer than 15 letters is invalid", 1, function () {
  initValidator();
  var prefix = $("#emailPrefix");
  prefix.val("MuchTooMuchText1");
  equal(groups_validator.element(prefix), false);
});

test("A prefix 'Valid' is valid", 2, function () {
  initValidator();
  var prefix = $("#emailPrefix");
  stop();
  prefix.val("Valid");
  // trigger validation
  groups_validator.element(prefix);
  $(document).ajaxStop(function () {
    $(document).unbind("ajaxStop");
    equal(groups_validator.element(prefix), true);
    deepEqual(groups_validator.errorList, []);
    start();
  });
});

test("A prefix 'groupa' is invalid", 3, function () {
  initValidator();
  var prefix = $("#emailPrefix");
  groups_validator.element(prefix);
  stop();
  prefix.val("groupa");
  equal(groups_validator.element(prefix), true);
  $(document).ajaxStop(function () {
    $(document).unbind("ajaxStop");
    equal(groups_validator.element(prefix), false);
    equal(groups_validator.errorList[0].message, 'Dieses Präfix ist bereits vergeben.');
    start();
  });
});




