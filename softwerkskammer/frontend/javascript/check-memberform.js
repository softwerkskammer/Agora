/*global nicknameIsNotAvailable, contentsOfNickname, emailAlreadyTaken */

// THE ORIGINAL OF THIS FILE IS IN frontend/javascript

var member_validator;
(function () {
  "use strict";

  var initValidator = function () {

    // DO NOT FORGET TO KEEP THIS FILE IN SYNC WITH /lib/commons/validation.js

    member_validator = $("#memberform, #participationform").validate(
      {
        rules: {
          nickname: {
            required: true,
            minlength: 2,
            remote: {
              url: "/members/checknickname",
              data: {
                previousNickname: function () {
                  return $("[name=previousNickname]").val();
                }
              }
            }
          },
          firstname: "required",
          lastname: "required",
          homeAddress: "required",
          tShirtSize: {
            required: function () {
              return $("#tShirtSizeMale").val() === '' && $("#tShirtSizeFemale").val() === '';
            }
          },
          email: {
            required: true,
            email: true,
            remote: {
              url: "/members/checkemail",
              data: {
                previousEmail: function () {
                  return $("[name=previousEmail]").val();
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
    );

    member_validator.form();
    member_validator.element($("#tShirtSizeMale"));
    member_validator.element($("#tShirtSizeFemale"));

    var handler = function (each) {
      return function () {
        member_validator.element(each);
      };
    };

    ["[name=nickname]", "[name=lastname]", "[name=firstname]", "[name=email]",
      "[name=profession]", "[name=location]", "[name=reference]", "[name=homeAddress]"].forEach(
      function (each) {
        $(each).on("change", handler(each));
        $(each).keyup(handler(each));
      }
    );
    ["[name=tShirtSize]"].forEach(
      function (each) {
        $(each).on("change", handler($("#tShirtSizeMale")));
        $(each).on("change", handler($("#tShirtSizeFemale")));
        $(each).keyup(handler($("#tShirtSizeMale")));
        $(each).keyup(handler($("#tShirtSizeFemale")));
      }
    );
  };
  $(document).ready(initValidator);
}());
