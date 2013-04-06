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
    errorPlacement: function (error, element) {
      error.appendTo(element.parent());
    },
    // set this class to error-labels to indicate valid fields
    success: function (label) {
      // set &nbsp; as text for IE
      label.html("&nbsp;").addClass("checked");
    },
    // and remove it again in case of error
    highlight: function (element, errorClass) {
      $(element).parent().find("." + errorClass).removeClass("checked");
    }
  });

  member_validator.form();

  ['#nickname', '#lastname', '#firstname', "#email", "#profession", "#location", "#reference"].forEach(function (each) {
    $(each).keyup(function () {
      member_validator.element(each);
    });
  });

};
$(document).ready(initValidator);