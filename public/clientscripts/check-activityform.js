/* global $, document */
"use strict";
var activity_validator;
var activity_datepicker;
var activity_timepicker;

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
        },
        alphanumeric: true
      },
      title: "required",
      location: "required",
      startDate: "required",
      startTime: "required"
    },
    messages: {
      url: {
        remote: $.validator.format("Diese URL ist leider nicht verfügbar."),
        alphanumeric: $.validator.format("URL darf nur Buchstaben, Zahlen und Unterstrich enthalten.")
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

var initPickers = function () {
  activity_datepicker = $('.datepicker').datepicker({
    format: 'dd.mm.yyyy',
    weekStart: 1,
    viewMode: 'days',
    minViewMode: 'days',
    language: 'de'
  });

  activity_timepicker = $('.timepicker').timepicker({
    minuteStep: 15,
    showSeconds: false,
    showMeridian: false,
    showInputs: true,
    disableFocus: false
  });
};

$(document).ready(initValidator);
$(document).ready(initPickers);
