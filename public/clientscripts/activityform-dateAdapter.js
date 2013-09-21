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

    var setEndDateTo = function (newEndDate) {
        if (endFieldWasNotEmptyOrDateChanged(newEndDate, $('#startDate').val(), $('#endDate').val())) {
            // only update the field if it was not empty or if the date is not the same
            $('#endDate').val(dateString(newEndDate));
        }
    };

    var setEndTimeTo = function (newEndDate) {
        $('#endTime').val(timeString(newEndDate));
    };

    var listener = function () {

        var currentStartDate = $('#startDate').val();
        var currentStartTime = $('#startTime').val();
        var currentEndDate = $('#endDate').val();
        var currentEndTime = $('#endTime').val();

        var newStartDate = toUtc(currentStartDate, currentStartTime);

        var offset = oldStartDate && newStartDate ? newStartDate.diff(oldStartDate, 'minutes') : 0;

        var endDayString = endDayStringOr(currentEndDate, oldStartDate);

        oldStartDate = newStartDate;

        if (offset !== 0) {
            var newEndDate = toUtc(endDayString, currentEndTime).add(offset, 'minutes');
            if (newEndDate) {
                setEndDateTo(newEndDate);
                setEndTimeTo(newEndDate);
            }
        }
    };

    var oldStartDate = toUtc($('#startDate').val(), $('#startTime').val());
    $('#startDate').change(listener);
    $('#startTime').change(listener);
};

