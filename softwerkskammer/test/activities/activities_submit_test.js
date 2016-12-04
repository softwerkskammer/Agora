'use strict';

const request = require('supertest');

const conf = require('../../testutil/configureForTest');
const beans = conf.get('beans');
const reservedURLs = conf.get('reservedActivityURLs');

const activitiesService = beans.get('activitiesService');

const chado = require('chado');
const cb = chado.callback;
const assume = chado.assume;

const createApp = require('../../testutil/testHelper')('activitiesApp').createApp;

describe('Activity application - on submit -', () => {

  beforeEach(() => {
    // will enhance the activitiesService with chado properties
    chado.createDouble('activitiesService', activitiesService);
  });

  afterEach(() => {
    // will undo the enhancements of the activitiesService with chado properties
    chado.reset();
  });

  it('rejects an activity with invalid and different url', done => {
    assume(activitiesService)
      .canHandle('isValidUrl')
      .withArgs(reservedURLs, 'edit', cb)
      .andCallsCallbackWith(null, false);

    request(createApp())
      .post('/submit')
      .send('url=edit')
      .send('previousUrl=aha')
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Diese URL ist leider nicht verfügbar\./, done);
  });

  it('rejects an activity with a url containing "/"', done => {
    assume(activitiesService)
      .canHandle('isValidUrl')
      .withArgs(reservedURLs, 'legal/egal', cb)
      .andCallsCallbackWith(null, false);

    request(createApp())
      .post('/submit')
      .send('url=legal/egal')
      .send('previousUrl=aha')
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Diese URL ist leider nicht verfügbar\./, done);
  });

  it('rejects an activity with a url containing "socrates-"', done => {
    request(createApp())
      .post('/submit')
      .send('url=socrates-2016')
      .send('previousUrl=aha')
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Diese URL ist leider nicht verfügbar\./, done);
  });

  it('rejects an activity with a url containing "SoCraTes-"', done => {
    request(createApp())
      .post('/submit')
      .send('url=SoCraTes-')
      .send('previousUrl=aha')
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Diese URL ist leider nicht verfügbar\./, done);
  });

  it('accepts an activity with valid and different url', done => {
    assume(activitiesService)
      .canHandle('isValidUrl')
      .withArgs(reservedURLs, 'uhu', cb)
      .andCallsCallbackWith(null, true);

    request(createApp())
      .post('/submit')
      .send('url=uhu')
      .send('previousUrl=aha')
      .expect(200, done);
  });

  it('rejects an activity with empty title', done => {
    request(createApp())
      .post('/submit')
      .send('url=uhu&previousUrl=uhu&location=X&startDate=02.07.2000&startTime=19:00&endDate=02.07.2000&endTime=21:00&resources[names]=x')
      .send('title=')
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Titel ist ein Pflichtfeld\./, done);
  });

  it('rejects an activity with different but valid url and with empty title', done => {
    assume(activitiesService)
      .canHandle('isValidUrl')
      .withArgs(reservedURLs, 'uhu', cb)
      .andCallsCallbackWith(null, true);

    request(createApp())
      .post('/submit')
      .send('url=uhu&previousUrl=uhuPrev&location=X&startDate=02.07.2000&startTime=19:00&endDate=02.07.2000&endTime=21:00&resources[names]=x')
      .send('title=')
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Titel ist ein Pflichtfeld\./, done);
  });

  it('rejects an activity whose resource limits are non-integral', done => {
    request(createApp())
      .post('/submit')
      .send('url=uhu&previousUrl=uhu&location=X&title=bla&startDate=02.07.2000&startTime=19:00&endDate=02.07.2000&endTime=21:00&resources[names]=test')
      .send('resources[limits]=&resources[limits]=7,5&resources[limits]=hallo')
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Die Ressourcenbeschränkungen dürfen nur aus Ziffern bestehen\./, done);
  });

});
