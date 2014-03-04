/* global $, document */
"use strict";
var addon_validator;

var initValidator = function () {

  // DO NOT FORGET TO KEEP THIS FILE IN SYNC WITH /lib/commons/validation.js

  addon_validator = $("#addonform").validate({
    rules: {
      homeAddress: "required",
      billingAddress: "required",
      tShirtSize: "required",
      roommate: "required"
    },
    errorElement: "span",
    errorClass: "help-block",
    highlight: function (element) {
      $(element).parent().addClass("has-error");
    },
    unhighlight: function (element) {
      $(element).parent().removeClass("has-error");
    }
  });

  addon_validator.form();

  ['#homeAddress', '#billingAddress', '#tShirtSize', '#roommate'].forEach(function (each) {
    $(each).on("change", function () {
      addon_validator.element(each);
    });
    $(each).keyup(function () {
      addon_validator.element(each);
    });
  });
};

$(document).bind('DOMSubtreeModified', function (e) {
  if ($(e.target).attr('id') === 'addOn') {
    addon_validator.form();
  }
});

$(document).ready(initValidator);
