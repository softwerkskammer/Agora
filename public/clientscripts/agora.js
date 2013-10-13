/* global $, document, window*/
"use strict";

var surroundWithLink = function (text) {
  // shamelessly stolen from http://stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript
  var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
  return text.replace(urlRegex, function (url) {
    return "<a href=\"" + url + "\" target=\"_blank\">" + "<i class=\"icon-external-link\"/> " + url + "</a>";
  });
};

var surroundTwitterName = function (twittername) {
  if (twittername.trim().length === 0) {
    return twittername;
  }
  return "<a href=\"http://twitter.com/" + twittername + "\" target=\"_blank\">@" + twittername + "</a>";
};

var surroundEmail = function (email) {
  return "<a href=\"mailto:" + email + "\">" + email + "</a>";
};

var initCalendar = function () {
  // page is now ready, initialize the calendar...
  $('#calendar').each(function () {
    $(this).fullCalendar({
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
};

var resizePreScrollable = function () {
  var h = $(window).height();
  $(".pre-scrollable").css('maxHeight', Math.max(h - 220, 100) + 'px');
};

var initPickers = function () {
  $('.datepicker').datepicker({
    autoclose: true,
    format: 'dd.mm.yyyy',
    weekStart: 1,
    viewMode: 'days',
    minViewMode: 'days',
    language: 'de'
  });

  $('.timepicker').timepicker({
    template: false,
    minuteStep: 15,
    showSeconds: false,
    showMeridian: false
  });

};

var highlightCurrentSection = function () {
  var loc = window.location.href; // returns the full URL
  $('li').filter(function () {
    return this.id && new RegExp(this.id).test(loc);
  }).first().addClass('active');
};

var addHelpButtonToTextarea = function () {
  $('textarea').each(function () {
    $(this).markdown({
        additionalButtons: [
          [
            {
              name: "groupCustom",
              data: [
                {
                  name: "cmdHelp",
                  title: "Help",
                  icon: "icon icon-question-sign",
                  callback: function () { $("#cheatsheet").modal({remote: "/cheatsheet.html"}); }
                }
              ]
            }
          ]
        ],
        onPreview: function (e) {
          $.post("/wiki/preview",
            {data: e.getContent(), subdir: ($("#subdir").val() || $("#assignedGroup").val() || $('#id').val())},
            function (data) { $(".md-preview").html(data); }
          );
        }
      }
    );
  });
};

var extendDataTables = function () {
  if (!$.fn.dataTableExt) { return; }
  $.extend($.fn.dataTableExt.oSort, {
    "date-eu-pre": function (dateString) {
      if (!dateString) { return 0; }
      var date = dateString.replace(" ", "");
      var eu_date = date.split('.');
      if (eu_date.length < 2) { return 0; }
      return (eu_date[2] + eu_date[1] + eu_date[0]) * 1;
    },
    "date-eu-asc": function (a, b) {
      return ((a < b) ? -1 : ((a > b) ? 1 : 0));
    },
    "date-eu-desc": function (a, b) {
      return ((a < b) ? 1 : ((a > b) ? -1 : 0));
    }
  });
};

$.event.add(window, "resize", resizePreScrollable);
$(document).ready(highlightCurrentSection);
$(document).ready(addHelpButtonToTextarea);
$(document).ready(initPickers);
$(document).ready(resizePreScrollable);
$(document).ready(initCalendar);
$(document).ready(extendDataTables);
$(document).ready(function () {
  $('.urlify').each(function () {
    $(this).html(surroundWithLink(this.innerHTML));
  });

  $('.twitterify').each(function () {
    $(this).html(surroundTwitterName(this.innerHTML));
  });

  $('.mailtoify').each(function () {
    $(this).html(surroundEmail(this.innerHTML));
  });
  $("[rel=tooltip]").each(function () {
    $(this).popover({html: true, trigger: "hover"});
  });
  $("[rel=tooltip-in-body]").each(function () {
    $(this).popover({container: "body", html: true, trigger: "hover"});
  });
});
