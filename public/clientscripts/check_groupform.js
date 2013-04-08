/* global $, document */
"use strict";
var groups_validator;

var initValidator = function () {
// validate signup form on keyup and submit
  groups_validator = $("#userform").validate({
    rules: {
      longName: {
        required: true,
        minlength: 2,
        remote: "/members/checknickname"
      }

    },
    messages: {
      longName: {
        remote: $.validator.format("Dieser Gruppenname ist bereits vergeben.")
      }
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

  groups_validator.form();

  ['#longName'].forEach(function (each) {
    $(each).keyup(function () {
      groups_validator.element(each);
    });
  });

};
$(document).ready(initValidator);
