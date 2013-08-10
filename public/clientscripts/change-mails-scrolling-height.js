/* global window, jQuery, $ */
"use strict";
function resizeMails()
{
  var h = $(window).height();
  $("#mails").css('maxHeight', Math.max(h - 100, 100) + 'px');
}

jQuery.event.add(window, "load", resizeMails);
jQuery.event.add(window, "resize", resizeMails);

