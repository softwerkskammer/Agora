/*eslint no-unused-vars: 0 */
var activityDateModel;
(function () {
  'use strict';

  // THE ORIGINAL OF THIS FILE IS IN frontend/javascript

  activityDateModel = function (initialDate, initialTime) {

    var toUtc = function (dateString, timeString) {
      // returns javascript Date or null
      function stringToInt(each) {
        const result = parseInt(each, 10);
        return isNaN(result) ? 0 : result;
      }

      if (dateString && timeString) {
        var dateArray = dateString.split('.').map(stringToInt);
        var timeArray = timeString.split(':').map(stringToInt);
        return new Date(Date.UTC(dateArray[2], dateArray[1] - 1, dateArray[0], timeArray[0], timeArray[1]));
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

      calculateNewEnd: function (currentTimes) {
        var offsetMillis = oldStartDate && currentTimes.start
          ? currentTimes.start.getTime() - oldStartDate.getTime()
          : 0;

        oldStartDate = currentTimes.start;

        return currentTimes.end
          ? new Date(currentTimes.end.getTime() + offsetMillis)
          : null;
      },

      createDateAndTimeStrings: function (jsDate) {
        var dateformat = new Intl.DateTimeFormat('de', {year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC'});
        var timeformat = new Intl.DateTimeFormat('de', {hour: '2-digit', minute: '2-digit', timeZone: 'UTC'});
        return {
          endDate: jsDate ? dateformat.format(jsDate) : '',
          endTime: jsDate ? timeformat.format(jsDate) : ''
        };
      },

      determineNewEnd: function (startDate, startTime, endDate, endTime) {
        var inputDateTimes = this.convertInputs(startDate, startTime, endDate, endTime);
        var newEndDateTime = this.calculateNewEnd(inputDateTimes);
        return this.createDateAndTimeStrings(newEndDateTime);
      }

    };
  };
}());
