/* global moment, fc_lang, datepicker_format, datepicker_lang, help */

var displayedActivityStart, displayedActivityEnd;

function initParameterisedCalendar(id, date) {
  'use strict';

  var isForActivities = id === '#calendar';
  $(id).fullCalendar({
    defaultDate: date,
    header: {
      left: 'title',
      center: '',
      right: isForActivities ? 'prev,today,next' : ''
    },
    timezone: 'Europe/Berlin',
    displayEventTime: false,
    events: isForActivities ? '/activities/eventsForSidebar' : '/wiki/eventsFor',
    eventMouseover: function (event) {
      var day = event.start.day();
      $(this).tooltip({
        title: (isForActivities ? event.start.format('HH:mm') + ': ' : '') + event.title,
        trigger: 'manual',
        placement: (day < 4 && day > 0) ? 'right' : 'left',
        container: 'body',
        template: '<div class="tooltip" role="tooltip" style="max-width: 130px"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
      });
      $(this).tooltip('show');
    },
    eventMouseout: function () {
      $(this).tooltip('dispose');
    },
    eventClick: function () {
      $(this).tooltip('dispose');
    },
    eventAfterAllRender: function () {
      if (displayedActivityStart) {
        this.calendar.select(displayedActivityStart, displayedActivityEnd);
      }
    },
    themeSystem: 'bootstrap4',
    aspectRatio: 1.2,
    height: 'auto',
    views: {
      month: {
        titleFormat: isForActivities ? 'MMM \'YY' : 'MMMM',
        lang: fc_lang,
        fixedWeekCount: false
      }
    }
  });
}

function surroundWithLink(text) {
  'use strict';

  // shamelessly stolen from http://stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript
  var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig;
  return text.replace(urlRegex, function (url) {
    return '<a href="' + url + '" target="_blank">' + '<i class="fa fa-external-link"/> ' + url + ' </a>';
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
      $(this).colorpicker();
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
    $.extend($.fn.dataTableExt.oSort, {
      'date-eu-pre': function (dateString) { return moment(dateString, 'DD.MM.YYYY HH:mm').unix(); },
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
    $('[rel=tooltip]').each(function () {
      $(this).popover({html: true, trigger: 'hover', delay: {hide: 50}, placement: 'auto'});
    });

    $('[rel=tooltip-in-body]').each(function () {
      $(this).popover({container: 'body', html: true, trigger: 'hover', delay: {hide: 50}, placement: 'auto'});
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
    var id = '#calendar';
    initParameterisedCalendar(id, moment());
  }

  $(document).ready(highlightCurrentSection);
  $(document).ready(initActivitiesCalendar);
  $(document).ready(interestify);

  $(document).ready(addHelpButtonToTextarea);
  $(document).ready(initPickersAndWidgets);
  $(document).ready(extendDataTables);
  $(document).ready(createLinks);
  $(document).ready(initTooltipsAndHovers);
  $.fn.select2.defaults.set('theme', 'bootstrap');
}());
