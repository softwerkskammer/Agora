/*global FileReader */

// THE ORIGINAL OF THIS FILE IS IN frontend/javascript

(function () {
  "use strict";
  $(function () {
    $("#input-file").on("change", function () {
      if (!this.files || !this.files[0]) { return null; }
      var reader = new FileReader();
      reader.onload = function (event) {
        $("img#preview").attr("src", event.target.result);
        $("#previewContainer").slideDown();
      };
      reader.readAsDataURL(this.files[0]);
      $('#selectFile').hide();
    });

    $("#btn-cancel").click(function () {
      $("#previewContainer").slideUp(200, function () {
        $("#selectFile").show();
      });
    });

    $("#recordForm").on("submit", function () {
      $("#recordForm button[type='submit']").prepend($("<i class='fa fa-fw fa-spinner fa-spin'/>&nbsp;"));
    });
  });

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
