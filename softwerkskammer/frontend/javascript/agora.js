/* global FullCalendar, fc_lang, datepicker_format, datepicker_lang, help, bootstrap */

var displayedActivityStart;

// eslint-disable-next-line no-unused-vars
function toUtc(dateString, timeString) {
  'use strict';
  // expects German strings like "30.11.1987" "12:30"
  // returns javascript Date or null
  function stringToInt(each) {
    var result = parseInt(each, 10);
    return isNaN(result) ? 0 : result;
  }

  if (dateString && timeString) {
    var dateArray = dateString.split(/[.|/]/).map(stringToInt);
    var timeArray = timeString.split(':').map(stringToInt);
    if (dateArray.length === 3 && timeArray.length === 2) {
      return new Date(Date.UTC(dateArray[2], dateArray[1] - 1, dateArray[0], timeArray[0], timeArray[1]));
    }
  }
  return null;
}

function initParameterisedCalendar(id, date) {
  'use strict';

  var isForActivities = id === 'calendar';
  var calElement = document.getElementById(id);
  if (!calElement) { return; }
  var calendar;
  var options = {
    initialView: 'dayGridMonth',
    themeSystem: 'bootstrap',
    locale: fc_lang,
    initialDate: date,
    eventDisplay: 'block',
    headerToolbar: {
      start: 'title',
      center: '',
      end: isForActivities ? 'prev,today,next' : ''
    },
    timezone: 'Europe/Berlin',
    displayEventTime: false,
    events: isForActivities ? '/activities/eventsForSidebar' : '/wiki/eventsFor',
    eventMouseEnter: function (mouseEnterInfo) {
      var event = mouseEnterInfo.event;
      $(mouseEnterInfo.el).tooltip({
        title: (isForActivities
          ? new Intl.DateTimeFormat(fc_lang).format(event.start, {hour: 'numeric', minute: 'numeric'}) + ': ' : '') + event.title,
        trigger: 'manual',
        container: 'body'
      });
      $(mouseEnterInfo.el).tooltip('show');
    },
    eventMouseLeave: function (mouseLeaveInfo) {
      $(mouseLeaveInfo.el).tooltip('dispose');
    },
    eventClick: function (eventClickInfo) {
      $(eventClickInfo.el).tooltip('dispose');
    },
    eventSourceSuccess: function () {
      if (displayedActivityStart) {
        calendar.gotoDate(displayedActivityStart);
        calendar.select(displayedActivityStart);
        displayedActivityStart = null;
      }
    },
    aspectRatio: 1.2,
    height: 'auto',
    views: {
      month: {
        titleFormat: isForActivities ? {month: 'short', year: '2-digit'} : {month: 'long'},
        fixedWeekCount: false,
        showNonCurrentDates: isForActivities
      }
    }
  };
  calendar = new FullCalendar.Calendar(calElement, options);
  calendar.render();
}

function surroundWithLink(text) {
  'use strict';

  // shamelessly stolen from http://stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript
  var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig;
  return text.replace(urlRegex, function (url) {
    return '<a href="' + url + '" target="_blank">' + '<i class="fa fa-external-link"></i> ' + url + ' </a>';
  });
}

function surroundTwitterName(twittername) {
  'use strict';

  if (twittername.trim().length === 0) {
    return twittername;
  }
  return '<a href="http://twitter.com/' + twittername + '" target="_blank">@' + twittername + '</a>';
}

function surroundEmail(email) {
  'use strict';

  return '<a href="mailto:' + email + '">' + email + '</a>';
}

function surroundInterestsWithLinks(string, casesensitive) {
  'use strict';

  var interests = string.split(',').map(function (each) {
    var interest = each.trim();
    return '<a href="/members/interests?interest=' + encodeURIComponent(interest) + (casesensitive || '') + '">' + each + '</a>';
  });
  return interests.join();
}

function interestify() {
  'use strict';

  $('.interestify').each(function () {
    $(this).html(surroundInterestsWithLinks(this.innerHTML, ''));
  });
  $('.interestify-case-sensitive').each(function () {
    $(this).html(surroundInterestsWithLinks(this.innerHTML, '&casesensitive=true'));
  });
}

(function () {
  'use strict';

  function addHelpButtonToTextarea() {
    $('.md-textarea').each(function () {
      $(this).markdown({
          additionalButtons: [[{
            name: 'groupCustom',
            data: [{
              name: 'cmdHelp',
              title: help,
              icon: 'fa fa-question-circle',
              callback: function () {
                $('#cheatsheet .modal-content').load('/cheatsheet.html');
                $('#cheatsheet').modal();
              }
            }]
          }]],
          onPreview: function (e) {
            $.post('/preview', {
                data: e.getContent(),
                subdir: ($('[name=subdir]').val() || $('[name=assignedGroup]').val() || $('[name=id]').val()),
                '_csrf': $('[name=_csrf]').val()
              },
              function (data) { e.$element.parent().find('.md-preview').html(data); });
            return ''; // to clearly indicate the loading...
          },
          iconlibrary: 'fa',
          language: datepicker_lang,
          resize: 'vertical'
        }
      );
    });
    $('.md-header .btn-default').removeClass('btn-default').addClass('btn-light');
    $('.md-header .fa').removeClass('fa').addClass('fas');
    $('.md-header .fa-header').removeClass('fa-header').addClass('fa-heading');
    $('.md-header .fa-picture-o').removeClass('fa-picture-o fas').addClass('fa-image far');
  }

  function initPickersAndWidgets() {
    $('.datepicker').each(function () {
      $(this).datepicker({
        autoclose: true,
        format: datepicker_format,
        weekStart: 1,
        viewMode: 'days',
        minViewMode: 'days',
        language: datepicker_lang,
        orientation: 'bottom'
      });
    });
    $('.timepicker').each(function () {
      $('.timepicker').timepicker({
        template: false,
        minuteStep: 15,
        showSeconds: false,
        showMeridian: false
      });
    });

    $('.c-picker').each(function () {
      $(this).colorpicker({format: 'hex', popover: false});
    });

    $('.enhance').each(function () {
      $(this).select2({
        width: null,
        containerCssClass: ':all:',
        minimumResultsForSearch: 20
      });
    });

    $('.trim-text').on('blur', function () {
      $(this).val($(this).val().trim());
    });
  }

  function extendDataTables() {
    if (!$.fn.dataTableExt) { return; }

    function utc(dateString) {
      function stringToInt(each) { return parseInt(each, 10); }

      var dateArray = dateString.split('.').map(stringToInt);
      return new Date(dateArray[2], dateArray[1] - 1, dateArray[0]).getTime();

    }

    $.extend($.fn.dataTableExt.oSort, {
      'date-eu-pre': function (dateString) { return utc(dateString); },
      'date-eu-asc': function (a, b) { return a - b; },
      'date-eu-desc': function (a, b) { return b - a; }
    });
  }

  function createLinks() {
    $('.urlify').each(function () {
      $(this).html(surroundWithLink(this.innerHTML));
    });

    $('.twitterify').each(function () {
      $(this).html(surroundTwitterName(this.innerHTML));
    });

    $('.mailtoify').each(function () {
      $(this).html(surroundEmail(this.innerHTML));
    });
  }

  function initTooltipsAndHovers() {
    [].slice.call(document.querySelectorAll('[rel=tooltip]')).map(function (popoverTriggerEl) {
      return new bootstrap.Popover(popoverTriggerEl, {html: true, trigger: 'hover', delay: {hide: 50}, placement: 'auto'});
    });

    [].slice.call(document.querySelectorAll('[rel=tooltip-in-body]')).map(function (popoverTriggerEl) {
      return new bootstrap.Popover(popoverTriggerEl, {container: 'body', html: true, trigger: 'hover', delay: {hide: 50}, placement: 'auto'});
    });

    $('.tooltipify').each(function () {
      $(this).tooltip();
      $(this).addClass('popover-highlight');
    });

    $('.tooltiplabel').each(function () {
      $(this).tooltip();
    });
  }

  function highlightCurrentSection() {
    $('[data-agoranav]').filter(function () {
      return new RegExp('^/' + $(this).attr('data-agoranav')).test(window.location.pathname);
    }).addClass('active');
  }

  function initActivitiesCalendar() {
    initParameterisedCalendar('calendar', new Date());
  }

  $(document).ready(highlightCurrentSection);
  $(document).ready(interestify);

  $(document).ready(addHelpButtonToTextarea);
  $(document).ready(initPickersAndWidgets);
  $(document).ready(extendDataTables);
  $(document).ready(createLinks);
  $(document).ready(initTooltipsAndHovers);
  $.fn.select2.defaults.set('theme', 'bootstrap-5');
  document.addEventListener('DOMContentLoaded', initActivitiesCalendar);
}());
