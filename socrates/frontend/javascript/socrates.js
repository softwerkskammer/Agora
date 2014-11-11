/*global URI, screen */
/*jslint nomen: true*/
(function () {
  'use strict';
  var highlightCurrentSection = function () {
    var result = URI.parse(window.location.href); // full URL
    $('ul.navbar-nav li a').filter(function () {
      return this.href.match(new RegExp(result.path + '$'));
    }).first().parent().addClass('active');
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

  $(document).ready(createLinks);
  $(document).ready(highlightCurrentSection);
  $(document).ready(twitterUtil);
}());
