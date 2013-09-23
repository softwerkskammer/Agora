/* global $, document */
"use strict";
var activity_validator;

var initValidator = function () {

  // DO NOT FORGET TO KEEP THIS FILE IN SYNC WITH /lib/commons/validation.js

  activity_validator = $("#activityform").validate({
    rules: {
      url: {
        required: true,
        remote: {
          url: "/activities/checkurl",
          data: {
            previousUrl: function () {
              return $("#previousUrl").val();
            }
          }
        }
      },
      title: "required",
      location: "required",
      startDate: "required",
      startTime: "required"
    },
    messages: {
      url: {
        remote: $.validator.format("Diese URL ist leider nicht verfügbar.")
      }
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

  activity_validator.form();

  ['#title', '#location', "#startDate", "#startTime", "#url"].forEach(function (each) {
    $(each).on("change", function () {
      activity_validator.element(each);
    });
    $(each).keyup(function () {
      activity_validator.element(each);
    });
  });
};


$(document).ready(initValidator);
$(document).ready(dateAdapter);
