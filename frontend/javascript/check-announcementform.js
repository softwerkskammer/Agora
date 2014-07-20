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
                return $("#announcementform [name=previousUrl]").val();
              }
            }
          }
        },
        title: "required",
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

    var handler = function (each) {
      return function () {
        announcement_validator.element(each);
      };
    };

    ['#announcementform [name=title]', '#announcementform [name=url]', "#announcementform [name=author]",
      "announcementform [name=thruDate]"].forEach(
      function (each) {
        $(each).on("change", handler(each));
        $(each).keyup(handler(each));
      }
    );
  };

  $(document).ready(initValidator);
}());
