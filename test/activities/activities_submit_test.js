"use strict";

var request = require('supertest');
var express = require('express');
var sinon = require('sinon').sandbox.create();

var conf = require('../configureForTest');

var activitiesCoreAPI = conf.get('beans').get('activitiesCoreAPI');

var app = conf.get('beans').get('activitiesApp')(express());

describe('Activity application - on submit -', function () {

  afterEach(function (done) {
    sinon.restore();
    done();
  });

  it('rejects an activity with invalid and different url', function (done) {
    sinon.stub(activitiesCoreAPI, 'isValidUrl', function (nickname, callback) {
      callback(null, false);
    });

    var root = express();
    root.use(express.urlencoded());
    root.use('/', app);
    request(root)
      .post('/submit')
      //.send('')
      .send('url=uhu')
      .send('previousUrl=aha')
      .expect(200)
      .expect(/Validation Error/)
      .expect(/Diese URL ist leider nicht verfügbar./, function (err) {
        done(err);
      });
  });

  it('rejects an activity with empty title', function (done) {

    var root = express();
    root.use(express.urlencoded());
    root.use('/', app);
    request(root)
      .post('/submit')
      .send('url=uhu&previousUrl=uhu&location=X&startDate=02.07.2000&startTime=19:00&endDate=02.07.2000&endTime=21:00')
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

    var root = express();
    root.use(express.urlencoded());
    root.use('/', app);
    request(root)
      .post('/submit')
      .send('url=uhu&previousUrl=uhuPrev&location=X&startDate=02.07.2000&startTime=19:00&endDate=02.07.2000&endTime=21:00')
      .expect(200)
      .expect(/Validation Error/)
      .expect(/Titel ist ein Pflichtfeld./, function (err) {
        done(err);
      });
  });

});