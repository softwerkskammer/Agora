
var toUtc = function (dateString, timeString) {
  if (dateString && timeString) {
    return moment.utc(dateString + " " + timeString, 'D.M.YYYY H:m');
  }
  return null;
};

var dateCalculator = function (initialDate, initialTime) {

  var dateString = function (date) {
    if (date) {
      return date.format('DD.MM.YYYY');
    }
    return "";
  };

  var oldStartDate = toUtc(initialDate, initialTime);

  return {
    getOldStartDate: function () {
      return oldStartDate;
    },

    convertInputs: function (startDate, startTime, endDate, endTime) {
      return {
        start: toUtc(startDate, startTime),
        end: toUtc(endDate || dateString(this.getOldStartDate()), endTime)
      };
    },

    calculateNewDates: function (currentTimes) {
      var offset = oldStartDate && currentTimes.start ? currentTimes.start.diff(oldStartDate, 'minutes') : 0;

      oldStartDate = currentTimes.start;

      currentTimes.end = currentTimes.end.add(offset, 'minutes');

      return currentTimes;
    }
  };
};
