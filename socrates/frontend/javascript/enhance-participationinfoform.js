// THE ORIGINAL OF THIS FILE IS IN frontend/javascript
(function () {
  'use strict';
  function disableParticipationSubmitButton() {
    $('#participationinfoform :submit').prop('disabled', ($('[name=nightsOptions]:checked').length === 0) || ($('[name=roomsOptions]:checked').length === 0));
  }

  $(function () {
    $('[name|=nightsOptions]').on('change', disableParticipationSubmitButton);
    $('[name|=roomsOptions]').on('change', disableParticipationSubmitButton);
  });
}());
