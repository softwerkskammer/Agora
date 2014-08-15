/*global FileReader */

(function () {
  'use strict';
  function getPreview(files, callback) {
    if (!files || !files[0]) {
      return null;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      callback(e.target.result);
    };
    reader.readAsDataURL(files[0]);
  }

  var numColsPerScreen = 3;

  function resizeColumns(totalWidth) {
    var columns = $('.timeline td, .timeline th');
    var newColumnWidth = Math.max(200, totalWidth / numColsPerScreen) + 'px';
    columns.css('width', newColumnWidth);
    columns.css('min-width', newColumnWidth);
  }

  $(function () {
    $("#input-file").on("change", function () {
      getPreview(this.files, function (imagedata) {
        $("img#preview").attr("src", imagedata);
        $("#previewContainer").slideDown();
      });
      $('.record').hide();
    });

    $('#btn-cancel').click(function () {
      $('#previewContainer').slideUp(200, function () {
        $('.record').slideDown();
      });
    });

    $('#recordForm').on('submit', function () {
      $('#recordForm button[type="submit"]').prepend($('<i class="fa fa-spinner fa-spin"/>&nbsp;'));
    });
  });

  $(function () {
    resizeColumns($(window).width());
    $(window).resize(function () {
      resizeColumns($(window).width());
    });
  });
}());