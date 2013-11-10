"use strict";

var request = require('supertest');
var sinon = require('sinon').sandbox.create();

var conf = require('../configureForTest');

var activitiesCoreAPI = conf.get('beans').get('activitiesCoreAPI');

var createApp = require('../testHelper')('activitiesApp').createApp;

describe('Activity application - on submit -', function () {

  afterEach(function (done) {
    sinon.restore();
    done();
  });

  it('rejects an activity with invalid and different url', function (done) {
    sinon.stub(activitiesCoreAPI, 'isValidUrl', function (nickname, callback) {
      callback(null, false);
    });

    request(createApp())
      .post('/submit')
      //.send('')
      .send('url=uhu&resources[names]=x')
      .send('previousUrl=aha')
      .expect(200)
      .expect(/Validation Error/)
      .expect(/Diese URL ist leider nicht verfügbar./, function (err) {
        done(err);
      });
  });

  it('rejects an activity with empty title', function (done) {

    request(createApp())
      .post('/submit')
      .send('url=uhu&previousUrl=uhu&location=X&startDate=02.07.2000&startTime=19:00&endDate=02.07.2000&endTime=21:00&resources[names]=x')
      .send('title=')
      .expect(200)
      .expect(/Validation Error/)
      .expect(/Titel ist ein Pflichtfeld./, function (err) {
        done(err);
      });
  });

  it('rejects an activity with different but valid url and with empty title', function (done) {
    sinon.stub(activitiesCoreAPI, 'isValidUrl', function (nickname, callback) {
      callback(null, true);
    });

    request(createApp())
      .post('/submit')
      .send('url=uhu&previousUrl=uhuPrev&location=X&startDate=02.07.2000&startTime=19:00&endDate=02.07.2000&endTime=21:00&resources[names]=x')
      .send('title=')
      .expect(200)
      .expect(/Validation Error/)
      .expect(/Titel ist ein Pflichtfeld./, function (err) {
        done(err);
      });
  });

  it('rejects an activity with two identical resource names', function (done) {
    sinon.stub(activitiesCoreAPI, 'isValidUrl', function (nickname, callback) {
      callback(null, true);
    });

    request(createApp())
      .post('/submit')
      .send('url=uhu&previousUrl=uhu&location=X&title=bla&startDate=02.07.2000&startTime=19:00&endDate=02.07.2000&endTime=21:00')
      .send('resources[names]=Doppelzimmer&resources[names]=Doppelzimmer')
      .expect(200)
      .expect(/Validation Error/)
      .expect(/Die Bezeichnungen der Ressourcen müssen eindeutig sein./, function (err) {
        done(err);
      });
  });

  it('rejects an activity whose resource names are empty', function (done) {
    sinon.stub(activitiesCoreAPI, 'isValidUrl', function (nickname, callback) {
      callback(null, true);
    });

    request(createApp())
      .post('/submit')
      .send('url=uhu&previousUrl=uhu&location=X&title=bla&startDate=02.07.2000&startTime=19:00&endDate=02.07.2000&endTime=21:00')
      .send('resources[names]=&resources[names]=')
      .expect(200)
      .expect(/Validation Error/)
      .expect(/Es muss mindestens eine Ressourcenbezeichnung angegeben werden./, function (err) {
        done(err);
      });
  });

  it('rejects an activity whose resource limits are non-integral', function (done) {
    sinon.stub(activitiesCoreAPI, 'isValidUrl', function (nickname, callback) {
      callback(null, true);
    });

    request(createApp())
      .post('/submit')
      .send('url=uhu&previousUrl=uhu&location=X&title=bla&startDate=02.07.2000&startTime=19:00&endDate=02.07.2000&endTime=21:00&resources[names]=test')
      .send('resources[limits]=&resources[limits]=7,5&resources[limits]=hallo')
      .expect(200)
      .expect(/Validation Error/)
      .expect(/Die Ressourcenbeschränkungen dürfen nur aus Ziffern bestehen./, function (err) {
        done(err);
      });
  });

});