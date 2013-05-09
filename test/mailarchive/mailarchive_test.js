"use strict";

var request = require('supertest');
var express = require('express');
var sinon = require('sinon');
var sinonSandbox = sinon.sandbox.create();
var expect = require('chai').expect;

var conf = require('../configureForTest');

var app = conf.get('beans').get('mailsApp')(express());
var mailsAPI = conf.get('beans').get('mailsAPI');
var Mail = conf.get('beans').get('mail');

describe('Mailarchive application', function () {
  beforeEach(function (done) {
//    var mailHeaders = sinonSandbox.stub(mailsAPI, 'mailHeaders4groupAndMonth', function (query, callback) {callback(null, [displayedMailHeader]); });
    done();
  });

  afterEach(function (done) {
    sinonSandbox.restore();
    done();
  });

  it('shows html if message contains html', function (done) {
    var displayedMail = new Mail({
      "dateUnix": 1364242214,
      "from": {
        "name": "Heißen",
        "address": "no@mail.de"
      },
      "html": "<div>Html message 1</div>",
      "id": "<message1@nomail.com>",
      "subject": "Mail 1",
      "text": "Plain text message 1.\n",
      "group": "group"
    });

    var mailForId = sinonSandbox.stub(mailsAPI, 'mailForId', function (id, callback) {callback(null, displayedMail); });
    request(app)
      .get('/show/mailID')
      .expect(200)
      .expect(/<div>Html message 1<\/div>/, function (err) {
        expect(mailForId.calledOnce).to.be.ok;
        done(err);
      });
  });
});

