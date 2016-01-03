'use strict';

var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');
var beans = require('../../testutil/configureForTest').get('beans');
var wikiService = beans.get('wikiService');
var Git = beans.get('gitmech');

describe('Wiki Service - Event Parsing', function () {
  afterEach(function () {
    sinon.restore();
  });

  it('parses an expected content', function (done) {
    var wikifile =
      '## Europaweite Veranstaltungen 2016\n' +
      '\n' +
      'Diese Seite bietet eine Übersicht über Konferenzen und ähnliche Veranstaltungen rund um Craftsmanship und Softwareentwicklung.\n' +
      '\n' +
      'Konferenzen, bei denen kein Datum angegeben ist, haben in den Vorjahren um diese Zeit stattgefunden. Wir haben jedoch noch keine aktuellen Informationen. (Weißt Du mehr? Dann trag das Datum und den Link einfach ein!)\n' +
      '\n' +
      'Konferenz | Ort | Wann\n' +
      '--- | ---   | ---\n' +
      '`Januar` |   |\n' +
      '[Codefreeze](http://www.codefreeze.fi/) | Kiilopää, Inari, Finnland   | 11.1.  \n' +
      '[DDD Europe](http://dddeurope.com) | Brüssel, Belgien | 28.1. -  29.1.\n' +
      '[Test Driven GeeCON](http://2015.tdd.geecon.org/)| Poznan, Polen  | \n' +
      '[The First International Conference on Software Archaeology](http://ticosa.org) | London   |\n' +
      '`Februar` |   |\n' +
      '[OOP](http://www.oop-konferenz.de/) | München  | 1.2.\n' +
      '[microXchg - The Microservices Conference](http://microxchg.io) | Berlin | 4.2.  - 5.2.';

    sinon.stub(Git, 'readFile', function (name, version, callback) {
      callback(null, wikifile);
    });

    wikiService.parseEvents('some date', function (err, events) {
      expect(events).to.have.length(4);
      done();
    });
  });
});
