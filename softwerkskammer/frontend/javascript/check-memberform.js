/*global nicknameIsNotAvailable, contentsOfNickname, emailAlreadyTaken, selectTshirtSize*/

// THE ORIGINAL OF THIS FILE IS IN frontend/javascript

var member_validator;
(function () {
  "use strict";

  $.validator.addMethod("tShirtSelected", function () {
    return $("#tShirtSizeMale").val() !== '' || $("#tShirtSizeFemale").val() !== '';
  }, selectTshirtSize);

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
          tShirtSize: "tShirtSelected",
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
          if ($(element).attr("id") === "tShirtSizeMale") {
            $("#tShirtBox").parent().addClass("has-error");
          }
          $(element).parent().addClass("has-error");
        },
        unhighlight: function (element) {
          $(element).parent().removeClass("has-error");
        },
        errorPlacement: function (error, element) {
          if (element.attr("id") === "tShirtSizeMale") {
            error.insertAfter("#tShirtBox");
          } else if (element.attr("id") !== "tShirtSizeFemale") {
            error.insertAfter(element);
          }
        }
      }
    );

    member_validator.form();

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
  };
  $(document).ready(initValidator);
}());
