var mail_validator;
(function () {
  "use strict";

  var initValidator = function () {

    // DO NOT FORGET TO KEEP THIS FILE IN SYNC WITH /lib/commons/validation.js

    mail_validator = $("#mailform").validate({
      rules: {
        subject: "required",
        markdown: "required"
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

    mail_validator.form();

    ['#subject', '#markdown'].forEach(function (each) {
      $(each).on("change", "keyup", function () {
        mail_validator.element(each);
      });
    });
  };

  $(document).ready(initValidator);
}());
