/* global $, document */
"use strict";
var groups_validator;

var initValidator = function () {

  groups_validator = $("#groupform").validate({
    rules: {
      id: {
        required: true,
        minlength: 2,
        maxlength: 20,
        alphanumeric: true,
        remote: "/groups/checkgroupname"
      },
      longName: "required",
      description: "required",
      type: "required"

    },
    messages: {
      id: {
        remote: $.validator.format("Dieser Gruppenname ist bereits vergeben."),
        alphanumeric: $.validator.format("Erlaubt sind nur Zahlen, Buchstaben und der Unterstrich.")
      }
    },
    errorElement: "span",
    errorClass: "help-inline error",
    highlight: function (element, errorClass) {
      $(element).parent().addClass("error");
    },
    unhighlight: function (element, errorClass) {
      $(element).parent().removeClass("error");
    }
  });

  groups_validator.form();

  ['#id', '#longName', '#description', '#type'].forEach(function (each) {
    $(each).keyup(function () {
      groups_validator.element(each);
    });
  });

};
$(document).ready(initValidator);
