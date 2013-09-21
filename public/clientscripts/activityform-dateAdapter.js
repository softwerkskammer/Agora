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

  var endDayStringOr = function (currentEndDate, oldStartDate) {
    // if the endDate field is empty, use the old contents of the start date field
    return currentEndDate || dateString(oldStartDate);
  };

  function endFieldWasNotEmptyOrDateChanged(newEndDate, currentStartDate, currentEndDate) {
    return currentEndDate || currentStartDate !== dateString(newEndDate);
  }

  var setEndDateTo = function (currentTimes, newEndDate) {
    if (endFieldWasNotEmptyOrDateChanged(newEndDate, $('#startDate').val(), $('#endDate').val())) {
      // only update the field if it was not empty or if the date is not the same
      var newEndDateString = dateString(newEndDate);
      currentTimes.endDate = newEndDateString;
      $('#endDate').val(currentTimes.endDate);
    }
  };

  var setEndTimeTo = function (currentTimes, newEndDate) {
    var newEndTimeString = timeString(newEndDate);
    currentTimes.endTime = newEndTimeString;
    $('#endTime').val(currentTimes.endTime);
  };

  function calculateNewDates(currentTimes) {
    var newStartDate = toUtc(currentTimes.startDate, currentTimes.startTime);

    var offset = oldStartDate && newStartDate ? newStartDate.diff(oldStartDate, 'minutes') : 0;

    var endDayString = endDayStringOr(currentTimes.endDate, oldStartDate);

    oldStartDate = newStartDate;

    if (offset !== 0) {
      var newEndDate = toUtc(endDayString, currentTimes.endTime).add(offset, 'minutes');
      if (newEndDate) {
        setEndDateTo(currentTimes, newEndDate);
        setEndTimeTo(currentTimes, newEndDate);
      }
    }
    return currentTimes;
  }

  var listener = function () {

    var currentStartDate = $('#startDate').val();
    var currentStartTime = $('#startTime').val();
    var currentEndDate = $('#endDate').val();
    var currentEndTime = $('#endTime').val();
    var currentTimes2 = {startDate: currentStartDate, startTime: currentStartTime, endDate: currentEndDate, endTime: currentEndTime};
    var currentTimes = calculateNewDates(currentTimes2);
  };

  var oldStartDate = toUtc($('#startDate').val(), $('#startTime').val());
  $('#startDate').change(listener);
  $('#startTime').change(listener);
};

