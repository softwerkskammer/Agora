
var dateCalculator = function (initialMoment) {

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

  var setEndDateTo = function (currentTimes, newEndDate) {
    if (currentTimes.endDate || dateString(currentTimes.start) !== dateString(newEndDate)) {
      // only update the field if it was not empty or if the date is not the same
      currentTimes.endDate = dateString(newEndDate);
    }
  };

  var setEndTimeTo = function (currentTimes, newEndDate) {
    currentTimes.endTime = timeString(newEndDate);
  };

  ////////////////////////////////////////////////////
  var oldStartDate = initialMoment;

  return {
    calculateNewDates: function (currentTimes) {
    var newStartDate = currentTimes.start;

    var offset = oldStartDate && newStartDate ? newStartDate.diff(oldStartDate, 'minutes') : 0;

    var endDayString = currentTimes.endDate || dateString(oldStartDate);
    // if the endDate field is empty, use the old contents of the start date field

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