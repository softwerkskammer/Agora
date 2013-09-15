/* global $, document */
"use strict";
var mail_validator;

var initValidator = function () {

  // DO NOT FORGET TO KEEP THIS FILE IN SYNC WITH /lib/commons/validation.js

  mail_validator = $("#mailform").validate({
    rules: {
      subject: "required",
      markdown: "required"
    },
    errorElement: "span",
    errorClass: "help-block",
    highlight: function (element, errorClass) {
      $(element).parent().addClass("has-error");
    },
    unhighlight: function (element, errorClass) {
      $(element).parent().removeClass("has-error");
    }
  });

  mail_validator.form();

  ['#subject', '#markdown'].forEach(function (each) {
    $(each).on("change", function () {
      mail_validator.element(each);
    });
    $(each).keyup(function () {
      mail_validator.element(each);
    });
  });
};


$(document).ready(initValidator);
