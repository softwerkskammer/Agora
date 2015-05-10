/*global moment */
/*eslint no-unused-vars: 0 */
var activityDateModel;
(function () {
  'use strict';

  // THE ORIGINAL OF THIS FILE IS IN frontend/javascript

  activityDateModel = function (initialDate, initialTime) {

    var toUtc = function (dateString, timeString) {
      if (dateString && timeString) {
        return moment.utc(dateString + ' ' + timeString, 'D.M.YYYY H:m');
      }
      return null;
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
          endDate: (endMoment ? endMoment.format('DD.MM.YYYY') : ''),
          endTime: (endMoment ? endMoment.format('HH:mm') : '')
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
