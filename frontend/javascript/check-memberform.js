/*global nicknameIsNotAvailable, contentsOfNickname, emailAlreadyTaken */
var member_validator;
(function () {
  "use strict";

  var initValidator = function () {

    // DO NOT FORGET TO KEEP THIS FILE IN SYNC WITH /lib/commons/validation.js

    member_validator = $("#memberform").validate(
      {
        rules: {
          nickname: {
            required: true,
            minlength: 2,
            remote: {
              url: "/members/checknickname",
              data: {
                previousNickname: function () {
                  return $("#memberform [name=previousNickname]").val();
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
                  return $("#memberform [name=previousEmail]").val();
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

    var handler = function (each) {
      return function () {
        member_validator.element(each);
      };
    };

    ['#memberform [name=nickname]', '#memberform [name=lastname]', '#memberform [name=firstname]', "#memberform [name=email]",
      "#memberform [name=profession]", "#memberform [name=location]", "#memberform [name=reference]"].forEach(
      function (each) {
        $(each).on("change", handler(each));
        $(each).keyup(handler(each));
      }
    );
  };
  $(document).ready(initValidator);
}());
