'use strict';

require('../../testutil/configureForTest');
var expect = require('must-dist');

var beans = require('simple-configure').get('beans');
var Activity = beans.get('activity');
var icalService = beans.get('icalService');

describe('ICalendar', function () {
  var activity = new Activity().fillFromUI({
    title: 'Title',
    startDate: '4.4.2013',
    startTime: '17:00',
    endTime: '18:00',
    endDate: '5.4.2013',
    url: 'myURL',
    description: 'foo',
    location: 'bar'
  });

  var activityWithCRLFs = new Activity().fillFromUI({
    title: 'Title',
    startDate: '4.4.2013',
    startTime: '17:00',
    endTime: '18:00',
    endDate: '5.4.2013',
    url: 'myURL',
    description: 'foo\r\nbar',
    location: 'musterstr\r\nkarlsruhe'
  });

  it('start date conversion', function () {
    expect(icalService.activityAsICal(activity).toString()).to.match(/DTSTART:20130404T150000Z/);
  });

  it('end date conversion', function () {
    expect(icalService.activityAsICal(activity).toString()).to.match(/DTEND:20130405T160000Z/);
  });

  it('render description', function () {
    expect(icalService.activityAsICal(activity).toString()).to.match(/DESCRIPTION:foo/);
  });

  it('render location', function () {
    expect(icalService.activityAsICal(activity).toString()).to.match(/LOCATION:bar/);
  });

  it('renders url', function () {
    expect(icalService.activityAsICal(activity).toString()).to.match(/URL:http:\/\/localhost:17125\/activities\/myURL/);
  });

  it('CRLFs in description are transformed to \\n', function () {
    expect(icalService.activityAsICal(activityWithCRLFs).toString()).to.match(/DESCRIPTION:foo\\nbar/);
  });

  it('CRLFs in location are transformed to \\n', function () {
    expect(icalService.activityAsICal(activityWithCRLFs).toString()).to.match(/LOCATION:musterstr\\nkarlsruhe/);
  });

});
