/*global urlIsNotAvailable */
var announcement_validator;
(function () {
  "use strict";

  var initValidator = function () {

    // DO NOT FORGET TO KEEP THIS FILE IN SYNC WITH /lib/commons/validation.js

    announcement_validator = $("#announcementform").validate({
      rules: {
        url: {
          required: true,
          remote: {
            url: "/announcements/checkurl",
            data: {
              previousUrl: function () {
                return $("#previousUrl").val();
              }
            }
          }
        },
        title: "required",
        author: "required",
        thruDate: "required"
      },
      messages: {
        url: {
          remote: $.validator.format(urlIsNotAvailable)
        }
      },
      errorElement: "span",
      errorClass: "help-block",
      highlight: function (element) {
        $(element).parent().addClass("has-error");
      },
      unhighlight: function (element) {
        $(element).parent().removeClass("has-error");
      }
    });

    announcement_validator.form();

    ['#title', '#url', "#author", "thruDate"].forEach(function (each) {
      $(each).on("change", "keyup", function () {
        announcement_validator.element(each);
      });
    });
  };

  $(document).ready(initValidator);
}());
