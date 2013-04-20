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




