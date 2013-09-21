var dateAdapter = function () {

  var toUtc = function (dateString, timeString) {
    if (dateString && timeString) {
      return moment.utc(dateString + " " + timeString, 'D.M.YYYY H:m');
    }
    return null;
  };


  var dateCalc = dateCalculator(toUtc($('#startDate').val(), $('#startTime').val()));


  var listener = function () {
    var currentStartDate = $('#startDate').val();

    var currentStartTime = $('#startTime').val();
    var currentEndDate = $('#endDate').val();
    var currentEndTime = $('#endTime').val();

    var currentTimes = dateCalc.calculateNewDates({startDate: currentStartDate, startTime: currentStartTime, endDate: currentEndDate, endTime: currentEndTime});

    $('#endDate').val(currentTimes.endDate);

    $('#endTime').val(currentTimes.endTime);
  };

  $('#startDate').change(listener);
  $('#startTime').change(listener);
};

