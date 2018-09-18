var mail_validator;

// THE ORIGINAL OF THIS FILE IS IN frontend/javascript

(function () {
  'use strict';

  function initValidator() {

    // DO NOT FORGET TO KEEP THIS FILE IN SYNC WITH /lib/commons/validation.js

    mail_validator = $('#mailform').validate({
      rules: {
        subject: 'required',
        markdown: 'required'
      },
      errorElement: 'span',
      errorClass: 'help-block text-danger',
      highlight: function (element) {
        if ($(element).hasClass('md-input')) {
          $(element).parent().parent().addClass('has-error');
        } else {
          $(element).addClass('is-invalid');
        }
      },
      unhighlight: function (element) {
        if ($(element).hasClass('md-input')) {
          $(element).parent().parent().removeClass('has-error');
        } else {
          $(element).removeClass('is-invalid');
        }
      }
    });

    mail_validator.form();

    function handler(each) {
      return function () {
        mail_validator.element(each);
      };
    }

    ['#mailform [name=subject]', '#mailform [name=markdown]'].forEach(function (each) {
      $(each).on('change', handler(each));
      $(each).keyup(handler(each));
    });
  }

  $(document).ready(initValidator);
}());
