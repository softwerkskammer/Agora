/* global $, document */
"use strict";

var initEditable = function () {
  $("table").find("a").filter(function () {return this.id !== "isAdmin"; }).editable({
    showbuttons: false,
    toggle: "mouseenter"
  });
  $("table").find("a").filter(function () {return this.id === "isAdmin"; }).editable(
    {source: [
      {value: 1, text: "Administrator"},
      {value: 2, text: "Normal"}
    ],
      showbuttons: false,
      toggle: "mouseenter"}
  );
};
$(document).ready(initEditable);
