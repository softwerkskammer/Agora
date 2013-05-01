/* global $, document */
"use strict";
var initEditable = function () {
  $("table").find("a").filter(function () {return $(this).data().type === "text"; }).editable({
    showbuttons: false
  });
  $("table").find("a").filter(function () {return $(this).data().type === "textarea"; }).editable();
  $("table").find(".tabdatepicker").editable({
    format: 'dd.mm.yyyy',
    viewformat: 'dd.mm.yyyy',
    datepicker: {
      language: 'de',
      weekStart: 1
    }
  });
};
$(document).ready(initEditable);
