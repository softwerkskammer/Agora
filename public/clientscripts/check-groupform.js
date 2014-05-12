/*global contentsOfPrefixForEMail, contentsOfEMailAddress, groupnameAlreadyTaken, contentsOfName, prefixAlreadyTaken, contentsOfAlphanumeric */
var groups_validator;
(function () {
  "use strict";

  var initValidator = function () {

    // DO NOT FORGET TO KEEP THIS FILE IN SYNC WITH /lib/commons/validation.js

    $.validator.addMethod("alnumdashblank", function (value, element) {
      return this.optional(element) || /^[a-z0-9 \-]+$/i.test(value);
    }, contentsOfPrefixForEMail);

    $.validator.addMethod("alnumdashunderscore", function (value, element) {
      return this.optional(element) || /^[a-z0-9_\-]+$/i.test(value);
    }, contentsOfAlphanumeric);

    groups_validator = $("#groupform").validate({
      rules: {
        id: {
          required: true,
          minlength: 2,
          maxlength: 20,
          alnumdashunderscore: "",
          remote: "/groups/checkgroupname"
        },
        emailPrefix: {
          required: true,
          minlength: 5,
          maxlength: 15,
          alnumdashblank: "",
          remote: "/groups/checkemailprefix"
        },
        longName: "required",
        description: "required",
        type: "required"

      },
      messages: {
        id: {
          remote: $.validator.format(groupnameAlreadyTaken)
        },
        emailPrefix: {
          remote: $.validator.format(prefixAlreadyTaken)
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

    groups_validator.form();

    var handler = function (each) {
      return function () {
        groups_validator.element(each);
      };
    };

    ["#groupform [name=id]", "#groupform [name=longName]", "#groupform [name=description]", "#groupform [name=type]",
      "#groupform [name=emailPrefix]"].forEach(
      function (each) {
        $(each).on("change", handler(each));
        $(each).keyup(handler(each));
      }
    );

  };
  $(document).ready(initValidator);
}());
