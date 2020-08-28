/*global surroundWithLink, surroundTwitterName, surroundEmail */
(function () {
  'use strict';

  describe('surround', function () {
    beforeEach(function (done) {
      $(document).ready(function () { done(); });
    });

    describe('surround with link', function () {
      it('surrounds a text starting with "http" with a link consisting of the text', function () {
        var result = surroundWithLink('http://my.link');
        expect(result).to.equal('<a href="http://my.link" target="_blank"><i class="fa fa-external-link"></i> http://my.link </a>');
      });

      it('surrounds each link in a text with two "http" links', function () {
        var result = surroundWithLink('http://my.link, http://your.link');
        expect(result).to.equal('<a href="http://my.link" target="_blank"><i class="fa fa-external-link"></i> http://my.link </a>, <a href="http://your.link" target="_blank"><i class="fa fa-external-link"></i> http://your.link </a>');
      });

      it('surrounds only links in a text', function () {
        var result = surroundWithLink('http://my.link, your.link');
        expect(result).to.equal('<a href="http://my.link" target="_blank"><i class="fa fa-external-link"></i> http://my.link </a>, your.link');
      });

      it('links an element inside class "urlify"', function () {
        expect($('#first').html()).to.equal('<a href="http://my.first.link" target="_blank"><i class="fa fa-external-link"></i> http://my.first.link </a>');
      });

      it('links two elements inside class "urlify"', function () {
        expect($('#second').html()).to.equal('<a href="http://my.first.link" target="_blank"><i class="fa fa-external-link"></i> http://my.first.link </a>, <a href="http://my.first.link.again" target="_blank"><i class="fa fa-external-link"></i> http://my.first.link.again </a>');
      });

      it('links one of two elements inside class "urlify"', function () {
        expect($('#third').html()).to.equal('<a href="http://my.first.link" target="_blank"><i class="fa fa-external-link"></i> http://my.first.link </a>, my.first.link.again');
      });
    });

    describe('surround twittername', function () {
      it('surrounds a text and prepends an "@"', function () {
        var result = surroundTwitterName('softwerkskammer');
        expect(result).to.equal('<a href="http://twitter.com/softwerkskammer" target="_blank">@softwerkskammer</a>');
      });

      it('surrounds a text inside class "twitterify" and prepends an "@"', function () {
        expect($('#fourth').html()).to.equal('<a href="http://twitter.com/softwerkskammer" target="_blank">@softwerkskammer</a>');
      });
    });

    describe('surround email', function () {
      it('surrounds a text with a "mailto:" link', function () {
        var result = surroundEmail('softwerks@kammer');
        expect(result).to.equal('<a href="mailto:softwerks@kammer">softwerks@kammer</a>');
      });

      it('surrounds a text inside class "mailtoify" with a "mailto:" link', function () {
        expect($('#fifth').html()).to.equal('<a href="mailto:softwerks@kammer.de">softwerks@kammer.de</a>');
      });
    });

  });
}());
