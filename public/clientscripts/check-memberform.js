/* global $, document, nicknameIsNotAvailable, contentsOfNickname, emailAlreadyTaken */
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
            email: true,
            remote: {
              url: "/members/checkemail",
              data: {
                previousEmail: function () {
                  return $("#previousEmail").val();
                }
              }
            }
          },
          location: "required",
          reference: "required",
          profession: "required"
        },
        messages: {
          nickname: {
            remote: $.validator.format(nicknameIsNotAvailable),
            alphanumeric: $.validator.format(contentsOfNickname)
          },
          email: {
            remote: $.validator.format(emailAlreadyTaken)
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
