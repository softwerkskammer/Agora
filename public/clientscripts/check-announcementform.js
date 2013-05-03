/* global $, document */
"use strict";
var announcement_validator;

var initValidator = function () {

  // DO NOT FORGET TO KEEP THIS FILE IN SYNC WITH /lib/commons/validation.js

  announcement_validator = $("#announcementform").validate({
    rules: {
      url: {
        required: true,
        remote: {
          url: "/announcement/checkurl",
          data: {
            previousUrl: function () {
              return $("#previousUrl").val();
            }
          }
        },
        alphanumeric: true
      },
      title: "required",
      shortDescription: "required",
      author: "required",
      text: "required",
      thrudate: "required"
    },
    messages: {
      url: {
        remote: $.validator.format("Diese URL ist leider nicht verfügbar."),
        alphanumeric: $.validator.format("URL darf nur Buchstaben, Zahlen und Unterstrich enthalten.")
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

  announcement_validator.form();

  ['#title', '#shortDescription', "#author", "#text", "#thrudate"].forEach(function (each) {
    $(each).on("change", function () {
      announcement_validator.element(each);
    });
    $(each).keyup(function () {
      announcement_validator.element(each);
    });
  });
};


$(document).ready(initValidator);
