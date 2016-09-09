(function () {
  'use strict';

  describe('Participation Form', function () {
    beforeEach(function (done) {
      $(document).ready(function () { done(); });
    });

    it('checks that the submit button gets enabled by checking an option', function () {
      expect($('#participationinfoform :checked').length).to.be(0);
      expect($('#participationinfoform :submit').prop('disabled')).to.be.true();

      var radio = $('[name=nightsOptions]').filter('[value="single,2"]');
      radio.click();
      radio.trigger('change');
      expect($('#participationinfoform :checked').length).to.be(1);
      expect($('#participationinfoform :submit').prop('disabled')).to.be.false();
    });

  });
}());
