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

var dateAdapter = function() {

  var toUtc = function (dateString, timeString) {
    if(dateString && timeString) {
      return moment.utc(dateString + " " + timeString, 'D.M.YYYY H:m');
    }
    return null;
  };

  var dateString = function (date) {
    if(date){
      return date.format('DD.MM.YYYY');
    }
    return "";
  };

  var timeString = function (time) {
    if(time){
      return time.format('HH:mm');
    }
    return "";
  };

  var endDayStringOr = function (oldStartDate) {
    // if the endDate field is empty, use the old contents of the start date field
    return $('#endDate').val() || dateString(oldStartDate);
  };

  var setEndFieldsTo = function (newEndDate) {
    if(!newEndDate) {
      return;
    }

    if($('#endDate').val() || $('#startDate').val() !== dateString(newEndDate) ){
      // only update the field if it was not empty or if the date is not the same
      $('#endDate').val(dateString(newEndDate));
    }
    $('#endTime').val(timeString(newEndDate));
  };

  var listener = function() {

    var newStartDate = toUtc($('#startDate').val(), $('#startTime').val());

    var offset = oldStartDate && newStartDate ? newStartDate.diff(oldStartDate, 'minutes') : 0;
    
    var endDayString = endDayStringOr(oldStartDate);

    oldStartDate = newStartDate;

    if( offset !== 0 ){
      var newEndDate = toUtc(endDayString, $('#endTime').val()).add(offset, 'minutes');
      setEndFieldsTo(newEndDate);
    }
  };

  var oldStartDate = toUtc($('#startDate').val(), $('#startTime').val());
  $('#startDate').change(listener);
  $('#startTime').change(listener);
};


$(document).ready(initValidator);
$(document).ready(dateAdapter);
