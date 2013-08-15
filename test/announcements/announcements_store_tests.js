/*global describe, it */
"use strict";
var expect = require('chai').expect;
var sinon = require('sinon');

var conf = require('../configureForTest');
var persistence = conf.get('beans').get('announcementsPersistence');
var store = conf.get('beans').get('announcementstore');

describe('Announcement store', function () {
  var announcement1 = {
    title: 'Neue Plattform ist online!',
    url: 'NeuePlattformistonline',
    text: '(Deutschland, Mai 2013) Seit heute ist die neue Plattform namens „Agora“ unter http://www.softwerkskammer.de erreichbar.',
    author: 'Frank Deberle'
  };

  var announcement2 = {
    title: 'Server down',
    'url': 'Serverdown',
    text: 'Aus technischen Gründen ist der Server leider down. Die genauen Gründe sind noch unbekannt.',
    author: 'Nicole'
  };

  var sampleList = [announcement1, announcement2];

  before(function (done) {
    var list = sinon.stub(persistence, 'list');
    list.callsArgWith(1, null, sampleList);
    done();
  });

  after(function (done) {
    persistence.list.restore();
    done();
  });

  it('calls persistence.list for store.allAnnouncements and passes on the given callback', function (done) {
    store.allAnnouncements(function (err, announcements) {
      expect(announcements[0].title).to.equal(announcement1.title);
      expect(announcements[1].title).to.equal(announcement2.title);
      done(err);
    });
  });

});
