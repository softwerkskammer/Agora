/*global activityDateModel, endMustBeAfterBegin, urlIsNotAvailable */
var activity_validator;
(function () {
  "use strict";

  $(document).ready(function () {

    var validateDateAndTime = function () {
      var startDate = $('#activityform [name=startDate]').val();
      var startTime = $('#activityform [name=startTime]').val();
      var endDate = $('#activityform [name=endDate]').val();
      var endTime = $('#activityform [name=endTime]').val();
      var dateAndTime = activityDateModel(startDate, startTime).convertInputs(startDate, startTime, endDate, endTime);
      return endDate !== "" && endTime !== "" && dateAndTime.end.diff(dateAndTime.start, 'minutes') > 0;
    };

    $.validator.addMethod("dateAndTime", validateDateAndTime, $.format(endMustBeAfterBegin));

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
                return $("#activityform [name=previousUrl]").val();
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
          remote: $.validator.format(urlIsNotAvailable)
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

    $("#activityform [name=endDate]").datepicker().on('changeDate', function () {
      activity_validator.element($('#activityform [name=endDate]'));
    });

    activity_validator.form();

    var handler = function (each) {
      return function () {
        activity_validator.element(each);
      };
    };

    ['#activityform [name=title]', '#activityform [name=location]', "#activityform [name=startDate]", "#activityform [name=startTime]",
      "#activityform [name=endDate]", "#activityform [name=endTime]", "#activityform [name=url]"].forEach(
      function (each) {
        $(each).on("change", handler(each));
        $(each).keyup(handler(each));
      }
    );
  };

  $(document).ready(initValidator);
}());
