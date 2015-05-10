// THE ORIGINAL OF THIS FILE IS IN frontend/javascript

(function () {
  'use strict';
  $(function () {
    $('[name=nightsOptions]').on('change', function () {
      $('#participationinfoform :submit').prop('disabled', ($('#participationinfoform :checked').length === 0));
    });
  });
}());
