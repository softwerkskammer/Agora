var dateAdapter = function () {

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

  var dateCalc = dateCalculator($('#startDate').val(), $('#startTime').val());

  var listener = function () {
    var hasEndDate = !!($('#endDate').val());

    var inputMoments = dateCalc.convertInputs($('#startDate').val(), $('#startTime').val(), $('#endDate').val(), $('#endTime').val());
    var currentTimes = dateCalc.calculateNewDates(inputMoments);

    var endStrings = {
      endDate: hasEndDate || dateString(currentTimes.start) !== dateString(currentTimes.end) ? dateString(currentTimes.end) : "",
      endTime: timeString(currentTimes.end)
    };

    $('#endDate').val(endStrings.endDate);
    $('#endTime').val(endStrings.endTime);
  };

  $('#startDate').change(listener);
  $('#startTime').change(listener);
};

