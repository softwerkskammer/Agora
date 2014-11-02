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

    var handler = function (each) {
      return function () {
        mail_validator.element(each);
      };
    };

    ["#mailform [name=subject]", "#mailform [name=markdown]"].forEach(function (each) {
      $(each).on("change", handler(each));
      $(each).keyup(handler(each));
    });
  };

  $(document).ready(initValidator);
}());
