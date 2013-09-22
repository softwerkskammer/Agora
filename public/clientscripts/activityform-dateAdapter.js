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
    var endStrings = dateCalc.determineNewEnd($('#startDate').val(), $('#startTime').val(), ($('#endDate').val()), $('#endTime').val());

    $('#endDate').val(endStrings.endDate);
    $('#endTime').val(endStrings.endTime);
  };

  $('#startDate').change(listener);
  $('#startTime').change(listener);
};

