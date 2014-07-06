/*global announcement_validator, urlIsNotAvailable */
(function () {
  'use strict';

  describe('Announcements Form', function () {
    var url = $('#announcementform [name=url]');
    var sandbox = sinon.sandbox.create();

    afterEach(function () {
      announcement_validator.resetForm();
      sandbox.restore();
    });

    var checkFieldMandatory = function (fieldname) {
      testglobals.mandatoryChecker(announcement_validator, fieldname);
    };

    it('checks that a url check response is handled for "true"', function () {
      sandbox.stub($, 'ajax').yieldsTo('success', true);
      url.val('test');
      // trigger validation
      url.trigger('change');

      expect(announcement_validator.element(url)).to.be(true);
      expect(announcement_validator.errorList).to.be.empty();
    });

    it('checks that a url check response is handled for "false"', function () {
      sandbox.stub($, 'ajax').yieldsTo('success', false);
      url.val('test');
      // trigger validation
      url.trigger('change');

      expect(announcement_validator.element(url)).to.be(false);
      expect(announcement_validator.errorList[0]).to.have.ownProperty('message', urlIsNotAvailable);
    });

    it('checks that a url call also sends the previousURl', function () {
      var spy = sandbox.spy($, 'ajax');
      var previousUrl = $('#announcementform [name=previousUrl]');
      previousUrl.val('previous');
      url.val('test');
      // trigger validation
      url.trigger('change');

      expect(spy.args[0][0].data.previousUrl()).to.equal('previous');
    });

    it('checks that "title" is mandatory', function () {
      checkFieldMandatory('#announcementform [name=title]');
    });

    it('checks that "url" is mandatory', function () {
      checkFieldMandatory('#announcementform [name=url]');
    });

    it('checks that "thruDate" is mandatory', function () {
      checkFieldMandatory('#announcementform [name=thruDate]');
    });

  });
}());
