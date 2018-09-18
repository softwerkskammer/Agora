/*global nicknameIsNotAvailable, contentsOfNickname, emailAlreadyTaken*/

// THE ORIGINAL OF THIS FILE IS IN frontend/javascript

var member_validator;
(function () {
  'use strict';

  function initValidator () {

    // DO NOT FORGET TO KEEP THIS FILE IN SYNC WITH /lib/commons/validation.js

    member_validator = $('#memberform, #participationform').validate(
      {
        rules: {
          nickname: {
            required: true,
            minlength: 2,
            remote: {
              url: '/members/checknickname',
              data: {
                previousNickname: function () {
                  return $('[name=previousNickname]').val();
                }
              }
            }
          },
          firstname: 'required',
          lastname: 'required',
          country: 'required',
          homeAddress: 'required',
          email: {
            required: true,
            email: true,
            remote: {
              url: '/members/checkemail',
              data: {
                previousEmail: function () {
                  return $('[name=previousEmail]').val();
                }
              }
            }
          },
          location: 'required',
          reference: 'required',
          profession: 'required'
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
        errorElement: 'span',
        errorClass: 'help-block text-danger',
        highlight: function (element) {
          $(element).addClass('is-invalid');
        },
        unhighlight: function (element) {
          $(element).removeClass('is-invalid');
        },
        errorPlacement: function (error, element) {
          error.insertAfter(element);
        }
      }
    );

    member_validator.form();

    function handler (each) {
      return function () {
        member_validator.element(each);
      };
    }

    ['nickname', 'lastname', 'firstname', 'country', 'email', 'profession', 'location', 'reference', 'homeAddress'].forEach(
      function (name) {
        var each = '[name=' + name + ']';
        $(each).on('change', handler(each));
        $(each).keyup(handler(each));
      }
    );
  }
  $(document).ready(initValidator);
}());
