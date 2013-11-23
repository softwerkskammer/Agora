"use strict";


require('../configureForTest');
var expect = require('chai').expect;

var beans = require('nconf').get('beans');
var Activity = beans.get('activity');
var icalAPI = beans.get('icalAPI');

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
    expect(icalAPI.activityAsICal(activity).toString()).to.match(/DTSTART:20130404T150000Z/);
  });

  it('end date conversion', function () {
    expect(icalAPI.activityAsICal(activity).toString()).to.match(/DTEND:20130405T160000Z/);
  });

  it('render description', function () {
    expect(icalAPI.activityAsICal(activity).toString()).to.match(/DESCRIPTION:foo/);
  });

  it('render location', function () {
    expect(icalAPI.activityAsICal(activity).toString()).to.match(/LOCATION:bar/);
  });
  
  it('renders url', function () {
    expect(icalAPI.activityAsICal(activity).toString()).to.match(/URL:http:\/\/localhost:17124\/activities\/myURL/);
  });
  
  it('CRLFs in description are transformed to \\n', function () {
    expect(icalAPI.activityAsICal(activityWithCRLFs).toString()).to.match(/DESCRIPTION:foo\\nbar/);
  });

  it('CRLFs in location are transformed to \\n', function () {
    expect(icalAPI.activityAsICal(activityWithCRLFs).toString()).to.match(/LOCATION:musterstr\\nkarlsruhe/);
  });
  
});
