/*global announcement_validator, urlIsNotAvailable */
(function () {
  'use strict';

  describe('Announcements Form', function () {
    var url = $('#announcementform [name=url]');

    var checkFieldMandatory = function (fieldname) {
      var field = $(fieldname);
      field.val('');
      expect(announcement_validator.element(field)).to.be(false);
      expect(announcement_validator.errorList[0].message).to.be('Dieses Feld ist ein Pflichtfeld.');
      field.val('a');
      expect(announcement_validator.element(field)).to.be(true);
    };

    it('checks that a url check response is handled for "true"', function () {
      sinon.stub($, 'ajax').yieldsTo('success', true);
      url.val('test1');
      // trigger validation
      url.trigger('change');

      expect(announcement_validator.element(url)).to.be(true);
      expect(announcement_validator.errorList).to.be.empty();
      $.ajax.restore();
    });

    it('checks that a url check response is handled for "false"', function () {
      sinon.stub($, 'ajax').yieldsTo('success', false);
      url.val('test2');
      // trigger validation
      url.trigger('change');

      expect(announcement_validator.element(url)).to.be(false);
      expect(announcement_validator.errorList[0]).to.have.ownProperty('message', urlIsNotAvailable);
      $.ajax.restore();
    });

    it('checks that a url call also sends the previousURl', function () {
      var spy = sinon.spy($, 'ajax');
      var previousUrl = $('#announcementform [name=previousUrl]');
      previousUrl.val('previous');
      url.val('test3');
      // trigger validation
      url.trigger('change');

      expect(spy.args[0][0].data.previousUrl()).to.equal('previous');
      $.ajax.restore();
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
