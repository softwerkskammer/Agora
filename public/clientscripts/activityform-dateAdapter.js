/* global $, dateCalculator */

"use strict";

var dateAdapter = function () {

  var dateCalc = activityDateModel($('#startDate').val(), $('#startTime').val());

  var listener = function () {
    var endStrings = dateCalc.determineNewEnd($('#startDate').val(), $('#startTime').val(), ($('#endDate').val()), $('#endTime').val());

    $('#endDate').val(endStrings.endDate);
    $('#endTime').val(endStrings.endTime);
  };

  $('#startDate').change(listener);
  $('#startTime').change(listener);
};

