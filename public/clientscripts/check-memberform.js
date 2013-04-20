/* global $, document */
"use strict";
var member_validator;

var initValidator = function () {
// validate signup form on keyup and submit
  member_validator = $("#memberform").validate({
    rules: {
      nickname: {
        required: true,
        minlength: 2,
        remote: "/members/checknickname"
      },
      firstname: "required",
      lastname: "required",
      email: {
        required: true,
        email: true
      },
      location: "required",
      reference: "required",
      profession: "required"
    },
    messages: {
      nickname: {
        remote: $.validator.format("Dieser Nickname ist leider nicht verfügbar.")
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

  member_validator.form();

  ['#nickname', '#lastname', '#firstname', "#email", "#profession", "#location", "#reference"].forEach(function (each) {
    $(each).on("change", function () {
      member_validator.element(each);
    });
  });

};
$(document).ready(initValidator);
