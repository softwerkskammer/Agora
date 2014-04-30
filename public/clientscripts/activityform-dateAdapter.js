/*global activityDateModel */
(function () {
  "use strict";

  var dateAdapter = function () {

    var dateCalc = activityDateModel($('#startDate').val(), $('#startTime').val());

    var listener = function () {
      var endStrings = dateCalc.determineNewEnd($('#startDate').val(), $('#startTime').val(), ($('#endDate').val()), $('#endTime').val());

      $('#endDate').data().datepicker.update(endStrings.endDate);
      $('#endTime').data().timepicker.setTime(endStrings.endTime);
    };

    $('#startDate').change(listener);
    $('#startTime').change(listener);
  };

  $(document).ready(dateAdapter);
}());
