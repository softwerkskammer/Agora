/* global $, document */
"use strict";
var groups_validator;

var initValidator = function () {

  // DO NOT FORGET TO KEEP THIS FILE IN SYNC WITH /lib/commons/validation.js

  $.validator.addMethod("alnumdashblank", function(value, element)
                        {
                          return this.optional(element) || /^[a-z0-9 -]+$/i.test(value);
                        }, "Präfix für E-Mails darf nur Zahlen, Buchstaben, Leerzeichen und Bindestriche enthalten.");

  $.validator.addMethod("alnumdashunderscore", function(value, element)
                        {
                          return this.optional(element) || /^[a-z0-9_-]+$/i.test(value);
                        }, "E-Mail-Adresse darf nur Zahlen, Buchstaben, Bindestrich und Unterstrich enthalten.");

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
        remote: $.validator.format("Dieser Gruppenname ist bereits vergeben."),
        alphanumeric: $.validator.format("Name darf nur Buchstaben, Zahlen und Unterstrich enthalten.")
      },
      emailPrefix: {
        remote: $.validator.format("Dieses Präfix ist bereits vergeben.")
      }
    },
    errorElement: "span",
    errorClass: "help-block",
    highlight: function (element, errorClass) {
      $(element).parent().addClass("has-error");
    },
    unhighlight: function (element, errorClass) {
      $(element).parent().removeClass("has-error");
    }
  });

  groups_validator.form();

  ["#id", "#longName", "#description", "#type", "#emailPrefix"].forEach(function (each) {
    $(each).on("change", function () {
      groups_validator.element(each);
    });
    $(each).keyup(function () {
      groups_validator.element(each);
    });
  });
  $.extend($.validator.messages, {
    alphanumeric: "Erlaubt sind nur Zahlen, Buchstaben und der Unterstrich."
  });

};
$(document).ready(initValidator);
