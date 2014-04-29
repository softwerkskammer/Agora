var addon_validator;
(function () {
  "use strict";

  var initValidator = function () {

    // DO NOT FORGET TO KEEP THIS FILE IN SYNC WITH /lib/commons/validation.js

    addon_validator = $("#addonform").validate({
      rules: {
        homeAddress: "required",
        billingAddress: "required",
        tShirtSize: "required"
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

    addon_validator.form();
    ['#addonform [name=homeAddress]', '#addonform [name=billingAddress]', '#addonform [name=tShirtSize]'].forEach(function (each) {
      $(each).on("change", "keyup", function () {
        addon_validator.element(each);
      });
    });
  };

  $(document).bind('DOMSubtreeModified', function (e) {
    if ($(e.target).attr('id') === 'addOn') {
      addon_validator.form();
    }
  });

  $(document).ready(initValidator);
}());
