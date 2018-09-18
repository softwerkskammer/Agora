
// THE ORIGINAL OF THIS FILE IS IN frontend/javascript

var addon_validator;
(function () {
  'use strict';

  function initValidator () {

    // DO NOT FORGET TO KEEP THIS FILE IN SYNC WITH /lib/commons/validation.js

    addon_validator = $('#paymentform').validate({
      rules: {
        amount: 'required',
        description: 'required'
      },
      errorElement: 'span',
      errorClass: 'help-block text-danger',
      highlight: function (element) {
        $(element).addClass('is-invalid');
      },
      unhighlight: function (element) {
        $(element).removeClass('is-invalid');
      }
    });

    addon_validator.form();

    function handler (each) {
      return function () {
        addon_validator.element(each);
      };
    }

    ['#paymentform [name=amount]', '#paymentform [name=description]'].forEach(function (each) {
      $(each).on('change', handler(each));
      $(each).keyup(handler(each));
    });
  }

  $(document).ready(initValidator);
}());
