/* global $, document */
"use strict";
var activity_validator;

var initValidator = function () {
// validate signup form on keyup and submit
  activity_validator = $("#activityform").validate({
    rules: {
      title: "required",
      location: "required",
      activityDate: {
        required: true,
        date: true
      }
    },
    messages: {
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

  activity_validator.form();

  ['#title', '#location', "#activityDate"].forEach(function (each) {
    $(each).keyup(function () {
      activity_validator.element(each);
    });
  });

};
$(document).ready(initValidator);
