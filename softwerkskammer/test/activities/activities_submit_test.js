'use strict';

var request = require('supertest');
var sinon = require('sinon').sandbox.create();

var chado = require('chado');
var activitiesServiceDouble = chado.createDouble('activitiesService');
var cb = chado.callback;
var assume = chado.assume;

var beans = require('../../testutil/configureForTest').get('beans');
var activitiesService = beans.get('activitiesService');

var createApp = require('../../testutil/testHelper')('activitiesApp').createApp;

describe('Activity application - on submit -', function () {

  afterEach(function () {
    sinon.restore();
    chado.reset();
  });

  it('rejects an activity with invalid and different url', function (done) {
    
    assume(activitiesServiceDouble, activitiesService)
      .canHandle('isValidUrl')
      .withArgs('^gdcr$|^upcoming$|^past$|^ical$|^eventsForSidebar$|^new$|^newLike$|^edit$|^submit$|^checkurl$|^subscribe$|^unsubscribe$|^addToWaitinglist$|^removeFromWaitinglist$|\\+', 'edit', cb)
      .andCallsCallbackWith(null, false);

    request(createApp())
      .post('/submit')
      .send('url=edit')
      .send('previousUrl=aha')
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Diese URL ist leider nicht verfügbar\./, function (err) {
        done(err);
      });
  });

  it('accepts an activity with valid and different url', function (done) {
    assume(activitiesServiceDouble, activitiesService)
      .canHandle('isValidUrl')
      .withArgs('^gdcr$|^upcoming$|^past$|^ical$|^eventsForSidebar$|^new$|^newLike$|^edit$|^submit$|^checkurl$|^subscribe$|^unsubscribe$|^addToWaitinglist$|^removeFromWaitinglist$|\\+', 'dontedit', cb)
      .andCallsCallbackWith(null, true);

    request(createApp())
      .post('/submit')
      .send('url=dontedit')
      .send('previousUrl=aha')
      .expect(200, function (err) {
        done(err);
      });
  });

  it('rejects an activity with empty title', function (done) {
    request(createApp())
      .post('/submit')
      .send('url=uhu&previousUrl=uhu&location=X&startDate=02.07.2000&startTime=19:00&endDate=02.07.2000&endTime=21:00&resources[names]=x')
      .send('title=')
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Titel ist ein Pflichtfeld\./, function (err) {
        done(err);
      });
  });

  it('rejects an activity with different but valid url and with empty title', function (done) {
    sinon.stub(activitiesService, 'isValidUrl', function (isReserved, nickname, callback) { callback(null, true); });

    request(createApp())
      .post('/submit')
      .send('url=uhu&previousUrl=uhuPrev&location=X&startDate=02.07.2000&startTime=19:00&endDate=02.07.2000&endTime=21:00&resources[names]=x')
      .send('title=')
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Titel ist ein Pflichtfeld\./, function (err) {
        done(err);
      });
  });

  it('rejects an activity with two identical resource names', function (done) {
    request(createApp())
      .post('/submit')
      .send('url=uhu&previousUrl=uhu&location=X&title=bla&startDate=02.07.2000&startTime=19:00&endDate=02.07.2000&endTime=21:00')
      .send('resources[names]=Doppelzimmer&resources[names]=Doppelzimmer')
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Die Bezeichnungen der Ressourcen müssen eindeutig sein\./, function (err) {
        done(err);
      });
  });

  it('rejects an activity whose resource names are empty', function (done) {
    request(createApp())
      .post('/submit')
      .send('url=uhu&previousUrl=uhu&location=X&title=bla&startDate=02.07.2000&startTime=19:00&endDate=02.07.2000&endTime=21:00')
      .send('resources[names]=&resources[names]=')
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Es muss mindestens eine Ressourcenbezeichnung angegeben werden\./, function (err) {
        done(err);
      });
  });

  it('rejects an activity whose resource limits are non-integral', function (done) {
    request(createApp())
      .post('/submit')
      .send('url=uhu&previousUrl=uhu&location=X&title=bla&startDate=02.07.2000&startTime=19:00&endDate=02.07.2000&endTime=21:00&resources[names]=test')
      .send('resources[limits]=&resources[limits]=7,5&resources[limits]=hallo')
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Die Ressourcenbeschränkungen dürfen nur aus Ziffern bestehen\./, function (err) {
        done(err);
      });
  });

});
