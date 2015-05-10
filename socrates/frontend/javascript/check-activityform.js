/*global activityDateModel, endMustBeAfterBegin */

// THE ORIGINAL OF THIS FILE IS IN frontend/javascript

var activity_validator;
(function () {
  'use strict';

  $(document).ready(function () {

    var validateDateAndTime = function () {
      var startDate = $('#activityform [name=startDate]').val();
      var startTime = $('#activityform [name=startTime]').val();
      var endDate = $('#activityform [name=endDate]').val();
      var endTime = $('#activityform [name=endTime]').val();
      var dateAndTime = activityDateModel(startDate, startTime).convertInputs(startDate, startTime, endDate, endTime);
      return endDate !== '' && endTime !== '' && dateAndTime.end.diff(dateAndTime.start, 'minutes') > 0;
    };

    $.validator.addMethod('dateAndTime', validateDateAndTime, $.validator.format(endMustBeAfterBegin));

  });

  var initValidator = function () {

    // DO NOT FORGET TO KEEP THIS FILE IN SYNC WITH /lib/commons/validation.js

    activity_validator = $('#activityform').validate({
      rules: {
        startDate: 'required',
        startTime: 'required',
        endDate: 'dateAndTime',
        endTime: 'dateAndTime'
      },
      errorPlacement: function (error, element) {
        if (element.attr('name') === 'endDate' || element.attr('name') === 'endTime') {
          error.insertAfter('#dates');
        } else {
          error.insertAfter(element);
        }
      },
      errorElement: 'span',
      errorClass: 'help-block',
      highlight: function (element) {
        if ($(element).attr('name') === 'endDate' || $(element).attr('name') === 'endTime') {
          $('#dates').parent().addClass('has-error');
        } else {
          $(element).parent().addClass('has-error');
        }
      },
      unhighlight: function (element) {
        if ($(element).attr('name') === 'endDate' || $(element).attr('name') === 'endTime') {
          $('#dates').parent().removeClass('has-error');
        } else {
          $(element).parent().removeClass('has-error');
        }
      }
    });

    $('#activityform [name=endDate]').datepicker().on('changeDate', function () {
      activity_validator.element($('#activityform [name=endDate]'));
    });

    activity_validator.form();

    var handler = function (each) {
      return function () {
        activity_validator.element(each);
      };
    };

    ['#activityform [name=startDate]', '#activityform [name=startTime]', '#activityform [name=endDate]', '#activityform [name=endTime]'].forEach(
      function (each) {
        $(each).on('change', handler(each));
        $(each).keyup(handler(each));
      }
    );
  };

  $(document).ready(initValidator);
}());
