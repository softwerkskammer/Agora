var dateAdapter = function () {


  var toUtc = function (dateString, timeString) {
    if (dateString && timeString) {
      return moment.utc(dateString + " " + timeString, 'D.M.YYYY H:m');
    }
    return null;
  };

  var dateString = function (date) {
    if (date) {
      return date.format('DD.MM.YYYY');
    }
    return "";
  };

  var timeString = function (time) {
    if (time) {
      return time.format('HH:mm');
    }
    return "";
  };

  var dateCalc = dateCalculator(toUtc($('#startDate').val(), $('#startTime').val()));

  var listener = function () {
    var currentTimes = dateCalc.calculateNewDates({
      endDate: $('#endDate').val(),
      start: toUtc($('#startDate').val(), $('#startTime').val()),
      end: toUtc($('#endDate').val() || dateString(dateCalc.getOldStartDate()), $('#endTime').val()) ,
      hasEndDate: !!($('#endDate').val())
    });

    $('#endDate').val(currentTimes.endDate);
    $('#endTime').val(timeString(currentTimes.end));
  };

  $('#startDate').change(listener);
  $('#startTime').change(listener);
};

