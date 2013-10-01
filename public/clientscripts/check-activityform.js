/* global $, document, activityDateModel, jQuery */
"use strict";
var activity_validator;

$(document).ready(function () {

  var validateDateAndTime = function () {
    var startDate = $('#startDate').val();
    var startTime = $('#startTime').val();
    var endDate = $('#endDate').val();
    var endTime = $('#endTime').val();
    var dateAndTime = activityDateModel(startDate, startTime).convertInputs(startDate, startTime, endDate, endTime);
    return endDate !== "" && endTime !== "" && dateAndTime.end.diff(dateAndTime.start, 'minutes') > 0;
  };

  jQuery.validator.addMethod("dateAndTime", validateDateAndTime, jQuery.format("Das Ende muss gefüllt sein und nach dem Beginn liegen."));

});


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
      startTime: "required",
      endDate: "dateAndTime",
      endTime: "dateAndTime"
    },
    groups: {
      dateAndTimeInterval: "endDate endTime"
    },
    messages: {
      url: {
        remote: $.validator.format("Diese URL ist leider nicht verfügbar.")
      }
    },
    errorPlacement: function (error, element) {
      if (element.attr("name") === "endDate" || element.attr("name") === "endTime") {
        error.insertAfter("#dates");
      } else {
        error.insertAfter(element);
      }
    },
    errorElement: "span",
    errorClass: "help-block",
    highlight: function (element) {
      if ($(element).attr("name") === "endDate" || $(element).attr("name") === "endTime") {
        $("#dates").parent().addClass("has-error");
      } else {
        $(element).parent().addClass("has-error");
      }
    },
    unhighlight: function (element) {
      if ($(element).attr("name") === "endDate" || $(element).attr("name") === "endTime") {
        $("#dates").parent().removeClass("has-error");
      } else {
        $(element).parent().removeClass("has-error");
      }
    }
  });

  $("#endDate").datepicker().on('changeDate', function () {
    activity_validator.element($('#endDate'));
  });

  activity_validator.form();

  ['#title', '#location', "#startDate", "#startTime", "#endDate", "#endTime", "#url"].forEach(function (each) {
    $(each).on("change", function () {
      activity_validator.element(each);
    });
    $(each).keyup(function () {
      activity_validator.element(each);
    });
  });
};


$(document).ready(initValidator);
