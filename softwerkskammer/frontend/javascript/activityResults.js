// THE ORIGINAL OF THIS FILE IS IN frontend/javascript

(function () {
  "use strict";
  $(function () {
    var numColsPerScreen = 3;

    function resizeColumns(totalWidth) {
      var columns = $("td, th");
      var newColumnWidth = Math.max(200, totalWidth / numColsPerScreen) + "px";
      columns.css("max-width", newColumnWidth);
      columns.css("min-width", newColumnWidth);
    }

    resizeColumns($(window).width());
    $(window).resize(function () {
      resizeColumns($(window).width());
    });
  });
}());
