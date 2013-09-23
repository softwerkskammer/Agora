/* global $, document */
"use strict";
var member_validator;

var initValidator = function () {

    // DO NOT FORGET TO KEEP THIS FILE IN SYNC WITH /lib/commons/validation.js

    member_validator = $("#memberform").validate({
        rules: {
          nickname: {
            required: true,
            minlength: 2,
            remote: {
              url: "/members/checknickname",
              data: {
                previousNickname: function () {
                  return $("#previousNickname").val();
                }
              }
            }
          },
          firstname: "required",
          lastname: "required",
          email: {
            required: true,
            email: true
          },
          location: "required",
          reference: "required",
          profession: "required"
        },
        messages: {
          nickname: {
            remote: $.validator.format("Dieser Nickname ist leider nicht verfügbar."),
            alphanumeric: $.validator.format("Nickname darf nur Buchstaben, Zahlen und Unterstrich enthalten.")
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
      }
    )
    ;

    member_validator.form();

    ['#nickname', '#lastname', '#firstname', "#email", "#profession", "#location", "#reference"].forEach(function (each) {
      $(each).on("change", function () {
        member_validator.element(each);
      });
      $(each).keyup(function () {
        member_validator.element(each);
      });

    });

  }
  ;
$(document).ready(initValidator);
