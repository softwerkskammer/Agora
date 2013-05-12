/* global $, document */
"use strict";
var mail_validator;

var initValidator = function () {

  // DO NOT FORGET TO KEEP THIS FILE IN SYNC WITH /lib/commons/validation.js

  mail_validator = $("#mailform").validate({
    rules: {
      subject: "required",
      htmltext: "required"
    },
    errorElement: "span",
    errorClass: "help-inline error",
    highlight: function (element, errorClass) {
      $(element).parent().addClass("error");
    },
    unhighlight: function (element, errorClass) {
      $(element).parent().removeClass("error");
    }
  });

  mail_validator.form();

  ['#subject', '#htmltext'].forEach(function (each) {
    $(each).on("change", function () {
      mail_validator.element(each);
    });
    $(each).keyup(function () {
      mail_validator.element(each);
    });
  });
};


$(document).ready(initValidator);
