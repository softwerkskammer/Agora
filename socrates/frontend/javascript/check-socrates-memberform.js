/*global member_validator */

// THE ORIGINAL OF THIS FILE IS IN frontend/javascript

(function () {
  'use strict';
  function enhanceMemberValidator() {
    /* istanbul ignore next */
    function handler() {
      return function () {
        member_validator.element($('#tShirtSizeMale'));
        member_validator.element($('#tShirtSizeFemale'));
      };
    }

    ['#tShirtSizeMale', '#tShirtSizeFemale'].forEach(
      function (each) {
        if (!$(each).length) { return; }
        member_validator.element(each);
        $(each).on('change', handler());
        $(each).keyup(handler());
      }
    );

  }

  $(document).ready(enhanceMemberValidator);
}());
