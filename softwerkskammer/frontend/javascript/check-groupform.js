/*global contentsOfPrefixForEMail, contentsOfEMailAddress, groupnameAlreadyTaken, contentsOfName, prefixAlreadyTaken, contentsOfAlphanumeric */
/*eslint no-unused-vars: 0 */

// THE ORIGINAL OF THIS FILE IS IN frontend/javascript

var groups_validator;
(function () {
  'use strict';

  function initValidator () {

    // DO NOT FORGET TO KEEP THIS FILE IN SYNC WITH /lib/commons/validation.js

    $.validator.addMethod('alnumdashblank', function (value, element) {
      return this.optional(element) || /^[a-z0-9 -]+$/i.test(value);
    }, contentsOfPrefixForEMail);

    $.validator.addMethod('alnumdashunderscore', function (value, element) {
      return this.optional(element) || /^[a-z0-9_-]+$/i.test(value);
    }, contentsOfAlphanumeric);

    groups_validator = $('#groupform').validate({
      rules: {
        id: {
          required: true,
          minlength: 2,
          maxlength: 20,
          alnumdashunderscore: '',
          remote: '/groups/checkgroupname'
        },
        emailPrefix: {
          required: true,
          minlength: 5,
          maxlength: 15,
          alnumdashblank: '',
          remote: '/groups/checkemailprefix'
        },
        longName: 'required',
        description: 'required',
        type: 'required'

      },
      messages: {
        id: {
          remote: $.validator.format(groupnameAlreadyTaken)
        },
        emailPrefix: {
          remote: $.validator.format(prefixAlreadyTaken)
        }
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

    groups_validator.form();

    function handler (each) {
      return function () {
        groups_validator.element(each);
      };
    }

    ['#groupform [name=id]', '#groupform [name=longName]', '#groupform [name=description]', '#groupform [name=type]',
      '#groupform [name=emailPrefix]'].forEach(
      function (each) {
        $(each).on('change', handler(each));
        $(each).keyup(handler(each));
      }
    );

  }
  $(document).ready(initValidator);

  // show / hide mapstuff widgets
  function hideMapInfos() {
    if ($('#type').val() === 'Themengruppe') {
      $('#mapstuff').hide();
    } else {
      $('#mapstuff').show();
    }
  }

  $(document).ready($('#type').on('change', hideMapInfos));
  hideMapInfos();
}());
