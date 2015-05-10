/*global screen, moment, datepicker_lang, datepicker_format, URI, help */
/*jslint nomen: true*/
(function () {
  'use strict';
  var highlightCurrentSection = function () {
    var result = URI.parse(window.location.href); // full URL
    var selections = $('[data-nav]').filter(function () {
      return new RegExp('^\/' + $(this).attr('data-nav')).test(result.path);
    });
    (selections.length > 0 ? selections : $('[data-nav-index]')).first().addClass('active');
  };

  var surroundWithLink = function (text) {
    // shamelessly stolen from http://stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript
    var urlRegex = /(\b(https?|ftp|file):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(urlRegex, function (url) {
      return '<a href="' + url + '" target="_blank">' + '<i class="fa fa-external-link"/> ' + url + '</a>';
    });
  };

  var surroundTwitterName = function (twittername) {
    if (twittername.trim().length === 0) {
      return twittername;
    }
    return '<a href="http://twitter.com/' + twittername + '" target="_blank">@' + twittername + '</a>';
  };

  var surroundEmail = function (email) {
    return '<a href="mailto:' + email + '">' + email + '</a>';
  };

  var createLinks = function () {
    $('.urlify').each(function () {
      $(this).html(surroundWithLink(this.innerHTML));
    });

    $('.twitterify').each(function () {
      $(this).html(surroundTwitterName(this.innerHTML));
    });

    $('.mailtoify').each(function () {
      $(this).html(surroundEmail(this.innerHTML));
    });
  };

  var twitterUtil = function () {
    /* eslint no-underscore-dangle: 0 */
    if (window.__twitterIntentHandler) { return; }
    var intentRegex = /twitter\.com(\:\d{2,4})?\/intent\/(\w+)/,
      windowOptions = 'scrollbars=yes,resizable=yes,toolbar=no,location=yes',
      width = 550,
      height = 420,
      winHeight = screen.height,
      winWidth = screen.width;

    function handleIntent(e) {
      e = e || window.event;
      var target = e.target || e.srcElement,
        m,
        left,
        top;

      while (target && target.nodeName.toLowerCase() !== 'a') {
        target = target.parentNode;
      }

      if (target && target.nodeName.toLowerCase() === 'a' && target.href) {
        m = target.href.match(intentRegex);
        if (m) {
          left = Math.round((winWidth / 2) - (width / 2));
          top = 0;

          if (winHeight > height) {
            top = Math.round((winHeight / 2) - (height / 2));
          }

          window.open(
            target.href,
            'intent',
            windowOptions + ',width=' + width + ',height=' + height + ',left=' + left + ',top=' + top
          );
          e.returnValue = false;
          if (e.preventDefault) { e.preventDefault(); }
        }
      }
    }

    if (document.addEventListener) {
      document.addEventListener('click', handleIntent, false);
    } else if (document.attachEvent) {
      document.attachEvent('onclick', handleIntent);
    }
    window.__twitterIntentHandler = true;
  };

  var addHelpButtonToTextarea = function () {
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
  };

  var initPickers = function () {
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

  };

  var extendDataTables = function () {
    if (!$.fn.dataTableExt) { return; }
    $.extend($.fn.dataTableExt.oSort, {
      'date-eu-pre': function (dateString) { return moment(dateString, 'DD.MM.YYYY HH:mm').unix(); },
      'date-eu-asc': function (a, b) { return a - b; },
      'date-eu-desc': function (a, b) { return b - a; }
    });
  };

  var addCount = function () {
    $.ajax({url: '/subscribers/count'}).done(function (count) {
      $('.count').text(count + ' people are interested in SoCraTes!');
    });
  };

  $(document).ready(highlightCurrentSection);
  $(document).ready(addHelpButtonToTextarea);
  $(document).ready(initPickers);
  $(document).ready(extendDataTables);
  $(document).ready(createLinks);
  $(document).ready(twitterUtil);
  $(document).ready(addCount);

}());
