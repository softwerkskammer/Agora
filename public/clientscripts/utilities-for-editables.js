/* global $, document */
"use strict";
var initEditable = function () {
  $("table").find("a").filter(function () {return $(this).data().type === "text"; }).editable({
    showbuttons: false
  });
  $("table").find("a").filter(function () {return $(this).data().type === "textarea"; }).editable();
};
$(document).ready(initEditable);
