var dateAdapter = function () {


  var toUtc = function (dateString, timeString) {
    if (dateString && timeString) {
      return moment.utc(dateString + " " + timeString, 'D.M.YYYY H:m');
    }
    return null;
  };

  var dateCalc = dateCalculator(toUtc($('#startDate').val(), $('#startTime').val()));

  var listener = function () {
    var currentTimes = dateCalc.calculateNewDates({
      endDate: $('#endDate').val(), endTime: $('#endTime').val(),
      start: toUtc($('#startDate').val(), $('#startTime').val()),
      end: toUtc($('#endDate').val() || $('#startDate').val(), $('#endTime').val()) ,
      hasEndDate: !!($('#endDate').val())
    });

    $('#endDate').val(currentTimes.endDate);
    $('#endTime').val(currentTimes.endTime);
  };

  $('#startDate').change(listener);
  $('#startTime').change(listener);
};

