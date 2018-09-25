/*global moment, fc_lang, URI*/

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

  function highlightCurrentSection() {
    var result = URI.parse(window.location.href); // full URL
    $('[data-agoranav]').filter(function () {
      return new RegExp('^/' + $(this).attr('data-agoranav')).test(result.path);
    }).addClass('active');
  }

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
  $(document).ready(adaptScrollableBox);
  $(document).ready(initActivitiesCalendar);
  $(document).ready(interestify);
}());
