/* global $, document */
"use strict";

// you need to include this js, if you use the date- or timepicker

$(document).ready(function () {
  $('.datepicker').datepicker({
    format: 'dd.mm.yyyy',
    weekStart: 1,
    viewMode: 'days',
    minViewMode: 'days',
    language: 'de'
  });

  $('.timepicker').timepicker({
    template: false,
    minuteStep: 15,
    showSeconds: false,
    showMeridian: false
  });

  $("#color").colorpicker();
  $("#colorText").on("change", function (event) {
    $("#color").colorpicker("setValue", event.target.value);
  });
  $("#colorText").on("keyup", function (event) {
    $("#color").colorpicker("setValue", event.target.value);
  });

});
