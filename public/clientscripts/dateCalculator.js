
var dateCalculator = function (initialValue) {

  var oldStartDate = initialValue;

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
    }
  };

  var setEndTimeTo = function (currentTimes, newEndDate) {
    var newEndTimeString = timeString(newEndDate);
    currentTimes.endTime = newEndTimeString;
  };

  return {
    calculateNewDates: function (currentTimes) {
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


};

};