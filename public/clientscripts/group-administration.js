/* global $, document */
"use strict";

var initEditable = function () {
  $("table").find("a").filter(function () {return this.id !== "type"; }).editable({
    showbuttons: false
  });
  $("table").find("a").filter(function () {return this.id === "type"; }).editable(
    {source: [
      {value: 1, text: "Themengruppe"},
      {value: 2, text: "Regionalgruppe"}
    ],
      showbuttons: false}
  );
};
$(document).ready(initEditable);
