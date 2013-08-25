/* global jQuery */
"use strict";

!(function (window, $) {

  var cheatsheetShown = false;

  var Jingo = {

    init: function () {
      function toggleCompareCheckboxes() {
        if ($hCol1.find(":checkbox").length === 1) {
          $hCol1.find(":checkbox").hide();
          $('#rev-compare').hide();
          return;
        }
        if ($hCol1.find(":checked").length === 2) {
          $hCol1.find(":not(:checked)")
            .hide();
          $hCol1.parent("tr")
            .css({"color": "silver"});
          $hCol1.find(":checked")
            .parents("tr")
            .css({"color": "black"});
        } else {
          $hCol1.find('input')
            .show()
            .parents("tr")
            .css({"color": "black"});
        }
      }

      var $hCol1 = $('.history td:first-child');

      toggleCompareCheckboxes();
      $hCol1.find('input').on('click', function () {
        toggleCompareCheckboxes();
      });

      $("#rev-compare").on("click", function () {
        if ($hCol1.find(":checked").length < 2) {
          return false;
        }
        window.location.href = "/wiki/compare/" + $(this).data('subdir') + "/" + $(this).data('pagename') + "/" + $hCol1.find(":checked").map(function () { return $(this).val(); }).toArray().reverse().join("..");
        return false;
      });

    },

    preview: function () {
      $('#preview').modal("show");
      $.post("/misc/preview", {data: $('#editor').val()}, function (data) {
        $('#preview .modal-body').html(data).get(0).scrollTop = 0;
      });
    },

    markdownSyntax: function () {
      $('#syntax-reference').modal("show");
      if (!cheatsheetShown) {
        $('#syntax-reference .modal-body').load("/misc/syntax-reference");
        cheatsheetShown = true;
      }
    }

  };

  window.Jingo = Jingo;

})(this, jQuery);
