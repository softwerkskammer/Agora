(function () {
  'use strict';

  describe('Participation Form', function () {
    beforeEach(function (done) {
      $(document).ready(function () { done(); });
    });

    it('checks that the submit button gets enabled by checking an option', function () {
      expect($('#participationinfoform :checked').length).to.be(0);
      expect($('#participationinfoform :submit').prop('disabled')).to.be.true();

      var radio = $('[name=nightsOptions]').filter('[value="2"]');
      radio.click();
      radio.trigger('change');
      var check = $('[name=roomsOptions]').filter('[value="single"]');
      check.click();
      check.trigger('change');
      expect($('#participationinfoform :checked').length).to.be(2);
      expect($('#participationinfoform :submit').prop('disabled')).to.be.false();
    });

  });
}());
