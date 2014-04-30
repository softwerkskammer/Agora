/*global moment */
var activityDateModel;
(function () {
  "use strict";

  activityDateModel = function (initialDate, initialTime) {

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

    var oldStartDate = toUtc(initialDate, initialTime);

    return {
      convertInputs: function (startDate, startTime, endDate, endTime) {
        return {
          start: toUtc(startDate, startTime),
          end: toUtc(endDate, endTime)
        };
      },

      calculateNewEndMoment: function (currentTimes) {
        var offset = oldStartDate && currentTimes.start ? currentTimes.start.diff(oldStartDate, 'minutes') : 0;

        oldStartDate = currentTimes.start;

        return currentTimes.end ? currentTimes.end.add(offset, 'minutes') : null;
      },

      createDateAndTimeStrings: function (endMoment) {
        return {
          endDate: dateString(endMoment),
          endTime: timeString(endMoment)
        };
      },

      determineNewEnd: function (startDate, startTime, endDate, endTime) {
        var inputMoments = this.convertInputs(startDate, startTime, endDate, endTime);
        var newEndMoment = this.calculateNewEndMoment(inputMoments);
        return this.createDateAndTimeStrings(newEndMoment);
      }

    };
  };
}());
