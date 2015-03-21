/*global member_validator */

// THE ORIGINAL OF THIS FILE IS IN frontend/javascript

(function () {
  "use strict";
  function enhanceMemberValidator() {
    function handler() {
      return function () {
        member_validator.element($("#tShirtSizeMale"));
        member_validator.element($("#tShirtSizeFemale"));
      };
    }

    ["#tShirtSizeMale", "#tShirtSizeFemale"].forEach(
      function (each) {
        member_validator.element(each);
        $(each).on("change", handler());
        $(each).keyup(handler());
      }
    );

  }

  $(document).ready(enhanceMemberValidator);
}());
