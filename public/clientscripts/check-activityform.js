/* global $, document */
"use strict";
var activity_validator;

var activity_datepicker;

var activity_timepicker;

var initValidator = function () {
// validate signup form on keyup and submit
  activity_validator = $("#activityform").validate({
    rules: {
      title: "required",
      location: "required",
      activityDate: "required"
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

var initDatePicker = function () {
  activity_datepicker =   $('.datepicker').datepicker({
    format: 'dd.mm.yyyy',
    weekStart: 1,
    viewMode: 'days',
    minViewMode: 'days',
    language: 'de'
  });
}

var initTimePicker = function () {
  activity_timepicker =   $('#startTime').timepicker({
    minuteStep: 1,
    showSeconds: false,
    showMeridian: false,
    showInputs: false,
    disableFocus: true
  });
}

$(document).ready(initValidator);

$(document).ready(initDatePicker);

$(document).ready(initTimePicker);