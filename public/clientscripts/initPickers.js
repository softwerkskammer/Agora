/* global $, document */
"use strict";

// you need to include this js, if you use the date- or timepicker

$(document).ready(function () {
  $('.datepicker').datepicker({
    autoclose: true,
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

});
