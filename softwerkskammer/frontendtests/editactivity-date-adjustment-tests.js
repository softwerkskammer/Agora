/*global activityDateModel toUtc*/

(function () {
  "use strict";

  function assertJsDate(jsDate, date, time) {
    expect(jsDate.toISOString()).to.equal(toUtc(date, time).toISOString());
  }

  describe("Date Adjustment", function () {
    beforeEach(function (done) {
      $(document).ready(function () {
        done();
      });
    });

    describe("Activity Date Model", function () {
      it("moves EndDate forward if StartDate contains the same date and is moved forward", function () {
        var model = activityDateModel("07.09.2013", "12:15");
        var result = model.calculateNewEnd({ start: toUtc("08.09.2013", "12:15"), end: toUtc("07.09.2013", "12:15") });
        assertJsDate(result, "08.09.2013", "12:15");
      });

      it("moves EndDate forward if StartDate contains a different date and is moved forward", function () {
        var model = activityDateModel("07.09.2013", "12:15");
        var result = model.calculateNewEnd({ start: toUtc("08.09.2013", "12:15"), end: toUtc("09.09.2013", "14:15") });
        assertJsDate(result, "10.09.2013", "14:15");
      });

      it("moves EndDate backward if StartDate contains the same date and is moved backward", function () {
        var model = activityDateModel("07.09.2013", "12:15");
        var result = model.calculateNewEnd({ start: toUtc("06.09.2013", "12:15"), end: toUtc("07.09.2013", "12:15") });
        assertJsDate(result, "06.09.2013", "12:15");
      });

      it("moves EndDate backward if StartDate contains a different date and is moved backward", function () {
        var model = activityDateModel("01.09.2013", "12:15");
        var result = model.calculateNewEnd({ start: toUtc("08.08.2013", "12:15"), end: toUtc("07.09.2013", "14:15") });
        assertJsDate(result, "14.08.2013", "14:15");
      });

      // Time

      it("moves EndTime forward if StartTime contains the same time and is moved forward", function () {
        var model = activityDateModel("07.09.2013", "12:15");
        var result = model.calculateNewEnd({ start: toUtc("07.09.2013", "14:15"), end: toUtc("07.09.2013", "12:15") });
        assertJsDate(result, "07.09.2013", "14:15");
      });

      it("moves EndTime forward if StartTime contains a different time and is moved forward", function () {
        var model = activityDateModel("07.09.2013", "12:15");
        var result = model.calculateNewEnd({ start: toUtc("07.09.2013", "15:45"), end: toUtc("09.09.2013", "14:15") });
        assertJsDate(result, "09.09.2013", "17:45");
      });

      it("moves EndTime backward if StartTime contains the same time and is moved backward", function () {
        var model = activityDateModel("07.09.2013", "12:15");
        var result = model.calculateNewEnd({ start: toUtc("07.09.2013", "10:10"), end: toUtc("07.09.2013", "12:15") });
        assertJsDate(result, "07.09.2013", "10:10");
      });

      it("moves EndTime backward if StartTime contains a different time and is moved backward", function () {
        var model = activityDateModel("01.09.2013", "12:15");
        var result = model.calculateNewEnd({ start: toUtc("01.09.2013", "00:00"), end: toUtc("07.09.2013", "14:15") });
        assertJsDate(result, "07.09.2013", "2:00");
      });

      it("moves EndDate and EndTime forward if StartTime is moved past midnight", function () {
        var model = activityDateModel("07.09.2013", "12:15");
        var result = model.calculateNewEnd({ start: toUtc("07.09.2013", "14:15"), end: toUtc("09.09.2013", "23:15") });
        assertJsDate(result, "10.09.2013", "1:15");
      });

      it("... if endDate is moved across the summertime boundary in spring", function () {
        var model = activityDateModel("29.03.2013", "12:15");
        var result = model.calculateNewEnd({ start: toUtc("30.03.2013", "12:15"), end: toUtc("30.03.2013", "14:15") });
        assertJsDate(result, "31.03.2013", "14:15");
      });

      it("... if endDate is moved across the summertime boundary in autumn", function () {
        var model = activityDateModel("25.10.2013", "20:15");
        var result = model.calculateNewEnd({ start: toUtc("26.10.2013", "20:15"), end: toUtc("26.10.2013", "23:15") });
        assertJsDate(result, "27.10.2013", "23:15");
      });

      it("... if endTime is moved across the summertime boundary in spring", function () {
        var model = activityDateModel("30.03.2013", "19:15");
        var result = model.calculateNewEnd({ start: toUtc("30.03.2013", "22:15"), end: toUtc("30.03.2013", "23:15") });
        assertJsDate(result, "31.03.2013", "2:15");
      });

      it("... if endTime is moved across the summertime boundary in autumn", function () {
        var model = activityDateModel("26.10.2013", "20:15");
        var result = model.calculateNewEnd({ start: toUtc("26.10.2013", "23:15"), end: toUtc("27.10.2013", "00:15") });
        assertJsDate(result, "27.10.2013", "3:15");
      });
    });

    describe("Input formatter", function () {
      it("transforms the input dates into Date objects", function () {
        var model = activityDateModel("01.10.2013", "20:15");
        var result = model.convertInputs("04.11.2013", "16:15", "07.12.2013", "19:25");
        assertJsDate(result.start, "04.11.2013", "16:15");
        assertJsDate(result.end, "07.12.2013", "19:25");
      });
    });

    describe("Output formatter", function () {
      it("creates end strings for the inputs", function () {
        var result = activityDateModel().createDateAndTimeStrings(toUtc("06.11.2013", "18:15"));
        expect(result.endDate).to.equal("06.11.2013");
        expect(result.endTime).to.equal("18:15");
      });
    });

    describe("Date Model", function () {
      it("does everything together", function () {
        var model = activityDateModel("07.09.2013", "12:15");
        var result = model.determineNewEnd("08.09.2013", "12:15", "09.09.2013", "14:15");
        expect(result.endDate).to.equal("10.09.2013");
        expect(result.endTime).to.equal("14:15");
      });
    });

    describe("global toUtc function", function () {
      it("can handle correct strings", function () {
        var result = toUtc("07.09.2013", "12:15");
        expect(result.toISOString()).to.equal("2013-09-07T12:15:00.000Z");
      });

      it("can handle incomplete date string", function () {
        var result = toUtc("07.2013", "12:15");
        expect(result).to.be(null);
      });

      it("can handle incomplete time string", function () {
        var result = toUtc("07.09.2013", "12");
        expect(result).to.be(null);
      });

      it("can handle incorrect date string", function () {
        var result = toUtc("07.September.2013", "12:15");
        expect(result.toISOString()).to.be("2012-12-07T12:15:00.000Z");
      });

      it("can handle incorrect time string", function () {
        var result = toUtc("07.09.2013", "12:Viertel");
        expect(result.toISOString()).to.be("2013-09-07T12:00:00.000Z");
      });
    });
  });
})();
