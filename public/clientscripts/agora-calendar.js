/* global $, document */
"use strict";

$(document).ready(function () {
  // page is now ready, initialize the calendar...
  $('#calendar').fullCalendar({
    aspectRatio: 1.2,
    firstDay: 1,
    weekMode: 'variable',
    timeFormat: 'H(:mm)',
    titleFormat: {
      month: 'MMM yy'
    },
    buttonText: {
      today: 'heute',
      prev: '<i class="icon-chevron-left"></i>',
      next: '<i class="icon-chevron-right"></i>'
    },
    monthNames: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    monthNamesShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
    dayNames: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
    dayNamesShort: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],

    events: '/activities/eventsForSidebar',
    eventMouseover: function (event, jsEvent, view) {
      var placement = "left";
      if (event.dayOfWeek < 4 && event.dayOfWeek > 0) {
        placement = "right";
      }
      $(this).tooltip({
        title: event.startTime + ": " + event.title,
        trigger: "manual",
        placement: placement
      });
      $(this).tooltip('show');
    },
    eventMouseout: function (event, jsEvent, view) {
      $(this).tooltip('destroy');
    }
  });
});
