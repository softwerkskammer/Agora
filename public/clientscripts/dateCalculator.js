
var dateCalculator = function (initialMoment) {

  var oldStartDate = initialMoment;

  return {
    getOldStartDate: function () {
      return oldStartDate;
    },

    calculateNewDates: function (currentTimes) {
      var offset = oldStartDate && currentTimes.start ? currentTimes.start.diff(oldStartDate, 'minutes') : 0;

      oldStartDate = currentTimes.start;

      currentTimes.end = currentTimes.end.add(offset, 'minutes');

      return currentTimes;
    }

  };

};