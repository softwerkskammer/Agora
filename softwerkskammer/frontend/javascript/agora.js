/*global moment, datepicker_lang, datepicker_format, fc_lang, URI, help */

var initParameterisedCalendar, interestify, surroundInterestsWithLinks, surroundWithLink, surroundTwitterName, surroundEmail, displayedActivityStart, displayedActivityEnd;
(function () {
  'use strict';

  interestify = function () {
    $('.interestify').each(function () {
      $(this).html(surroundInterestsWithLinks(this.innerHTML, ''));
    });
    $('.interestify-case-sensitive').each(function () {
      $(this).html(surroundInterestsWithLinks(this.innerHTML, '&casesensitive=true'));
    });
  };

  surroundInterestsWithLinks = function (string, casesensitive) {
    var interests = string.split(',').map(function (each) {
      var interest = each.trim();
      return '<a href="/members/interests?interest=' + encodeURIComponent(interest) + (casesensitive || '') + '">' + each + '</a>';
    });
    return interests.join();
  };

  surroundWithLink = function (text) {
    // shamelessly stolen from http://stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript
    var urlRegex = /(\b(https?|ftp|file):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(urlRegex, function (url) {
      return '<a href="' + url + '" target="_blank">' + '<i class="fa fa-external-link"/> ' + url + '</a>';
    });
  };

  surroundTwitterName = function (twittername) {
    if (twittername.trim().length === 0) {
      return twittername;
    }
    return '<a href="http://twitter.com/' + twittername + '" target="_blank">@' + twittername + '</a>';
  };

  surroundEmail = function (email) {
    return '<a href="mailto:' + email + '">' + email + '</a>';
  };

  initParameterisedCalendar = function (id, date) {
    var isForActivities = id === '#calendar';
    $(id).fullCalendar({
      defaultDate: date,
      header: {
        left: 'title',
        center: '',
        right: isForActivities ? 'prev,today,next' : ''
      },
      titleFormat: {
        month: isForActivities ? 'MMM \'YY' : 'MMMM'
      },
      timezone: 'Europe/Berlin',
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
        $(this).tooltip('destroy');
      },
      eventAfterAllRender: function () {
        if (displayedActivityStart) {
          this.calendar.select(displayedActivityStart, displayedActivityEnd);
        }
      },
      bootstrap: true,
      buttonIcons: {
        prev: 'fa-caret-left',
        next: 'fa-caret-right'
      },
      aspectRatio: 1.2,
      height: 'auto',
      views: {
        month: {
          lang: fc_lang,
          fixedWeekCount: false
        }
      }
    });
  };

  function initActivitiesCalendar() {
    var id = '#calendar';
    initParameterisedCalendar(id, moment());
  }

  function adaptScrollableBox() {
    var h = $(window).height();
    var padtop = parseInt($('body').css('padding-top'), 10);
    var padbottom = parseInt($('body').css('padding-bottom'), 10);
    var otherElementsHeight = 120;
    $('.scrollable-box').css('maxHeight', Math.max(h - (padtop + padbottom + otherElementsHeight), 250) + 'px');
    $('.scrollable-box').css('margin-bottom', '0px');
    $('.scrollable-box').css('overflow-y', 'scroll');
  }

  function initPickers() {
    $('.datepicker').datepicker({
      autoclose: true,
      format: datepicker_format,
      weekStart: 1,
      viewMode: 'days',
      minViewMode: 'days',
      language: datepicker_lang
    });

    $('.timepicker').timepicker({
      template: false,
      minuteStep: 15,
      showSeconds: false,
      showMeridian: false
    });

  }

  function highlightCurrentSection() {
    var result = URI.parse(window.location.href); // full URL
    $('[data-agoranav]').filter(function () {
      return new RegExp('^\/' + $(this).attr('data-agoranav')).test(result.path);
    }).addClass('active');
  }

  function addHelpButtonToTextarea() {
    $('.md-textarea').each(function () {
      $(this).markdown(
        {
          additionalButtons: [
            [
              {
                name: 'groupCustom',
                data: [
                  {
                    name: 'cmdHelp',
                    title: help,
                    icon: 'fa fa-question-circle',
                    callback: function () { $('#cheatsheet').modal({remote: '/cheatsheet.html'}); }
                  }
                ]
              }
            ]
          ],
          onPreview: function (e) {
            $.post('/preview',
              {
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
    interestify();
  }

  function initTooltipsAndHovers() {
    $('[rel=tooltip]').each(function () {
      $(this).popover({html: true, trigger: 'hover', delay: {hide: 50}});
    });

    $('[rel=tooltip-in-body]').each(function () {
      $(this).popover({container: 'body', html: true, trigger: 'hover', delay: {hide: 50}});
    });

    $('.tooltipify').each(function () {
      $(this).tooltip();
      $(this).addClass('popover-highlight');
    });
  }

  function patchBootstrapPopover() {
    var originalLeave = $.fn.popover.Constructor.prototype.leave;
    $.fn.popover.Constructor.prototype.leave = function (obj) {
      var self = obj instanceof this.constructor ? obj : $(obj.currentTarget)[this.type](this.getDelegateOptions()).data('bs.' + this.type);
      var container, timeout;

      originalLeave.call(this, obj);

      if (obj.currentTarget) {
        container = $('.popover');
        timeout = self.timeout;
        container.one('mouseenter', function () {
          //We entered the actual popover – call off the dogs
          clearTimeout(timeout);
          //Let's monitor popover content instead
          container.one('mouseleave', function () {
            $.fn.popover.Constructor.prototype.leave.call(self, self);
          });
        });
      }
    };
  }

  patchBootstrapPopover();
  $.event.add(window, 'resize', adaptScrollableBox);
  $(document).ready(highlightCurrentSection);
  $(document).ready(addHelpButtonToTextarea);
  $(document).ready(initPickers);
  $(document).ready(adaptScrollableBox);
  $(document).ready(initActivitiesCalendar);
  $(document).ready(extendDataTables);
  $(document).ready(createLinks);
  $(document).ready(initTooltipsAndHovers);
}());
