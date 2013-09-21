var dateAdapter = function () {

  var dateCalc = dateCalculator($('#startDate').val(), $('#startTime').val());


  var listener = function () {
    var currentTimes = dateCalc.calculateNewDates({startDate: $('#startDate').val(), startTime: $('#startTime').val(),
      endDate: $('#endDate').val(), endTime: $('#endTime').val()});

    $('#endDate').val(currentTimes.endDate);
    $('#endTime').val(currentTimes.endTime);
  };

  $('#startDate').change(listener);
  $('#startTime').change(listener);
};

