/* global $ */
"use strict";

$('.collapse').on('show', function () {
  $(this).parent().find(".icon-caret-right").removeClass("icon-caret-right").addClass("icon-caret-down");
});
$('.collapse').on('hide', function () {
  $(this).parent().find(".icon-caret-down").removeClass("icon-caret-down").addClass("icon-caret-right");
});
