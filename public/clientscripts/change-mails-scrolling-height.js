/* global window, jQuery, $, document */
"use strict";
function resizePreScrollable()
{
  var h = $(window).height();
  $(".pre-scrollable").css('maxHeight', Math.max(h - 220, 100) + 'px');
}

jQuery.event.add(window, "resize", resizePreScrollable);
$(document).ready(resizePreScrollable);
