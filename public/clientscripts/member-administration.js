/* global $, document */
"use strict";

var initValidator = function () {
  $("table").find("a").filter(function () {return this.id !== "isAdmin"; }).editable();
//  $("table").find("a").filter(function () {return this.id === "isAdmin"; }).editable({
//    source: [{value: "true", text: "true"}, {value: "false", text: "false"}]
//  });
};
$(document).ready(initValidator);
