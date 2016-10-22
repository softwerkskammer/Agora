/*global URI*/
(function () {
  'use strict';

  function highlightCurrentSection() {
    var result = URI.parse(window.location.href); // full URL
    var selections = $('[data-nav]').filter(function () {
      return new RegExp('^\/' + $(this).attr('data-nav')).test(result.path);
    });
    (selections.length > 0 ? selections : $('[data-nav-index]')).first().addClass('active');
  }

  function twitterUtil() {
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
  }

  function addCount() {
    $.ajax({url: '/subscribers/count'}).done(function (count) {
      $('.count').text(count + ' people are interested in SoCraTes!');
    });
  }

  $(document).ready(highlightCurrentSection);
  $(document).ready(twitterUtil);
  $(document).ready(addCount);

}());
