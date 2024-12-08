"use strict";

require("../../testutil/configureForTest");

const expect = require("must-dist");
const sinon = require("sinon").createSandbox();

const calendarService = require("../../lib/activities/calendarService");
const fieldHelpers = require("../../lib/commons/fieldHelpers");
const Activity = require("../../lib/activities/activity");
const activitystore = require("../../lib/activities/activitystore");

describe("Calendar Service", () => {
  const start = fieldHelpers.parseToDateTimeUsingDefaultTimezone("01.04.2013");
  const end = fieldHelpers.parseToDateTimeUsingDefaultTimezone("01.05.2013");
  const activity = new Activity({
    title: "Title",
    startDate: fieldHelpers.parseToDateTimeUsingDefaultTimezone("04.04.2013").toJSDate(),
    endDate: fieldHelpers.parseToDateTimeUsingDefaultTimezone("05.04.2013").toJSDate(),
    url: "myURL",
  });

  before(() => {
    sinon.stub(activitystore, "allActivitiesByDateRangeInAscendingOrder").returns([activity]);
  });

  it("loads and converts a wellformed Activity to a calendar display event without colors given", () => {
    const events = calendarService.eventsBetween(start.toMillis(), end.toMillis(), null);
    expect(events).to.have.length(1);
    const event = events[0];
    expect("Title").to.equal(event.title);
    expect("2013-04-04T00:00:00.000+02:00").to.equal(event.start); // includes timezone offset!
    expect(event.url).to.match("/activities/myURL$");
    expect("#353535").to.equal(event.color);
  });
});
