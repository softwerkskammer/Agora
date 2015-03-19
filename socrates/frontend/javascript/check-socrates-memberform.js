/*global member_validator */

// THE ORIGINAL OF THIS FILE IS IN frontend/javascript

(function () {
  "use strict";
  function enhanceMemberValidator() {
    function handler(each) {
      return function () {
        member_validator.element(each);
      };
    }

    member_validator.element($("#tShirtSizeMale"));
    member_validator.element($("#tShirtSizeFemale"));
    $("[name=tShirtSize]").each(
      function (each) {
        $(each).on("change", handler($("#tShirtSizeMale")));
        $(each).on("change", handler($("#tShirtSizeFemale")));
        $(each).keyup(handler($("#tShirtSizeMale")));
        $(each).keyup(handler($("#tShirtSizeFemale")));
      }
    );
  }
  $(document).ready(enhanceMemberValidator);
}());
