/* global $, document */
"use strict";

var initValidator = function () {
  $("table").find("a").editable();
};
$(document).ready(initValidator);
