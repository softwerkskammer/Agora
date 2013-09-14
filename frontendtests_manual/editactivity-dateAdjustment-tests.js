/* global $, setFixtures, expect, dateAdapter */
"use strict";

describe("StartDate and EndDate adjustment", function () {

  beforeEach(function () {
    setFixtures('<form id="activityform" action="submit" method="post">' +
                '<input id="startDate" type="text" name="startDate"/>' +
                '<input id="startTime" type="text" name="startTime"/>' +
                '<input id="endDate" type="text" name="endDate"/>' +
                '<input id="endTime" type="text" name="endTime"/>' +
                '</form>');
  });

  var initialize = function (startDate, startTime, endDate, endTime) {
    $('#startDate').val(startDate);
    $('#startTime').val(startTime);
    $('#endDate').val(endDate);
    $('#endTime').val(endTime);
    // because we need oldStartDate to be initialized properly:
    dateAdapter();
  };

  var setStartDate = function (startDate) {
    $('#startDate').val(startDate);
    $("#startDate").trigger("change");
  };

  var setStartTime = function (startTime) {
    $('#startTime').val(startTime);
    $("#startTime").trigger("change");
  };

  var assert = function (startDate, startTime, endDate, endTime) {
    expect($('#startDate').val()).toEqual(startDate);
    expect($('#startTime').val()).toEqual(startTime);
    expect($('#endDate').val()).toEqual(endDate);
    expect($('#endTime').val()).toEqual(endTime);
  };

  it("moves EndDate forward if StartDate contains the same date and is moved forward", function () {

    initialize("07.09.2013", "12:15", "07.09.2013", "12:15");
    setStartDate("08.09.2013");
    assert("08.09.2013", "12:15", "08.09.2013", "12:15");

  });

  it("moves EndDate forward if StartDate contains a different date and is moved forward", function () {

    initialize("07.09.2013", "12:15", "09.09.2013", "14:15");
    setStartDate("08.09.2013");
    assert("08.09.2013", "12:15", "10.09.2013", "14:15");
  });

  it("moves EndDate backward if StartDate contains the same date and is moved backward", function () {

    initialize("07.09.2013", "12:15", "07.09.2013", "12:15");
    setStartDate("06.09.2013");
    assert("06.09.2013", "12:15", "06.09.2013", "12:15");

  });

  it("moves EndDate backward if StartDate contains a different date and is moved backward", function () {

    initialize("01.09.2013", "12:15", "07.09.2013", "14:15");
    setStartDate("08.08.2013");
    assert("08.08.2013", "12:15", "14.08.2013", "14:15");
  });

  it("leaves the EndDate empty if the StartDate is changed and the EndDate is empty", function () {

    initialize("01.09.2013", "12:15", "", "14:15");
    setStartDate("04.09.2013");
    assert("04.09.2013", "12:15", "", "14:15");
  });

// Time

  it("moves EndTime forward if StartTime contains the same time and is moved forward", function () {

    initialize("07.09.2013", "12:15", "07.09.2013", "12:15");
    setStartTime("14:15");
    assert("07.09.2013", "14:15", "07.09.2013", "14:15");

  });

  it("moves EndTime forward if StartTime contains a different time and is moved forward", function () {

    initialize("07.09.2013", "12:15", "09.09.2013", "14:15");
    setStartTime("15:45");
    assert("07.09.2013", "15:45", "09.09.2013", "17:45");
  });

  it("moves EndTime backward if StartTime contains the same time and is moved backward", function () {

    initialize("07.09.2013", "12:15", "07.09.2013", "12:15");
    setStartTime("10:10");
    assert("07.09.2013", "10:10", "07.09.2013", "10:10");

  });

  it("moves EndTime backward if StartTime contains a different time and is moved backward", function () {

    initialize("01.09.2013", "12:15", "07.09.2013", "14:15");
    setStartTime("00:00");
    assert("01.09.2013", "00:00", "07.09.2013", "02:00");
  });

  it("moves EndDate and EndTime forward if StartTime is moved past midnight", function () {

    initialize("07.09.2013", "12:15", "09.09.2013", "23:15");
    setStartTime("14:15");
    assert("07.09.2013", "14:15", "10.09.2013", "01:15");

  });

  it("fills EndDate and moves EndTime forward if EndDate is empty and StartTime is moved past midnight", function () {

    initialize("07.09.2013", "12:15", "", "23:15");
    setStartTime("14:15");
    assert("07.09.2013", "14:15", "08.09.2013", "01:15");

  });

  it("... if endDate is moved across the summertime boundary in spring", function () {

    initialize("29.03.2013", "12:15", "30.03.2013", "14:15");
    setStartDate("30.03.2013");
    assert("30.03.2013", "12:15", "31.03.2013", "14:15");
  });

  it("... if endDate is moved across the summertime boundary in autumn", function () {

    initialize("25.10.2013", "20:15", "26.10.2013", "23:15");
    setStartDate("26.10.2013");
    assert("26.10.2013", "20:15", "27.10.2013", "23:15");
  });

  it("... if endTime is moved across the summertime boundary in spring", function () {

    initialize("30.03.2013", "19:15", "30.03.2013", "23:15");
    setStartTime("22:15");
    assert("30.03.2013", "22:15", "31.03.2013", "02:15"); // ?!
  });

  it("... if endTime is moved across the summertime boundary in autumn", function () {

    initialize("26.10.2013", "20:15", "27.10.2013", "00:15");
    setStartTime("23:15");
    assert("26.10.2013", "23:15", "27.10.2013", "03:15");
  });

});
