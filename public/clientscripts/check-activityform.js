/* global $, document, activityDateModel, jQuery */
"use strict";
var activity_validator;

$(document).ready(function () {

  var validateDateAndTime = function () {
    var dateAndTime = activityDateModel().convertInputs($('#startDate').val(), $('#startTime').val(), $('#endDate').val(), $('#endTime').val());
    return dateAndTime.end.diff(dateAndTime.start, 'minutes') > 0;
  };

  jQuery.validator.addMethod("dateAndTime", validateDateAndTime, jQuery.format("Das Ende der Aktivität muss nach ihrem Beginn liegen."));
  $("#endDate").datepicker().on('changeDate', function () {
    $("#activityform").validate().element($('#endDate'));
  });
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
