/*global moment, datepicker_lang, datepicker_format, help */

function surroundWithLink(text) {
  'use strict';

  // shamelessly stolen from http://stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript
  var urlRegex = /(\b(https?|ftp|file):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|])/ig;
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

(function () {
  'use strict';

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
  }

  function initPickersAndWidgets() {
    $('.datepicker').datepicker({
      autoclose: true,
      format: datepicker_format,
      weekStart: 1,
      viewMode: 'days',
      minViewMode: 'days',
      language: datepicker_lang,
      orientation: 'bottom'
    });

    $('.timepicker').timepicker({
      template: false,
      minuteStep: 15,
      showSeconds: false,
      showMeridian: false
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
      $(this).popover({html: true, trigger: 'hover', delay: {hide: 50}});
    });

    $('[rel=tooltip-in-body]').each(function () {
      $(this).popover({container: 'body', html: true, trigger: 'hover', delay: {hide: 50}});
    });

    $('.tooltipify').each(function () {
      $(this).tooltip();
      $(this).addClass('popover-highlight');
    });

    $('.tooltiplabel').each(function () {
      $(this).tooltip();
    });
  }

  patchBootstrapPopover();
  $(document).ready(addHelpButtonToTextarea);
  $(document).ready(initPickersAndWidgets);
  $(document).ready(extendDataTables);
  $(document).ready(createLinks);
  $(document).ready(initTooltipsAndHovers);
  $.fn.select2.defaults.set('theme', 'bootstrap');
}());
