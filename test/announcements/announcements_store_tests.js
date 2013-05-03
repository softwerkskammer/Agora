/*global describe, it */
"use strict";
require('chai').should();

var proxyquire = require('proxyquire'),
  sinon = require('sinon');

var persistenceStub = {
  save: function () {
  },
  getById: function () {
  },
  getByField: function () {
  },
  list: function () {
  }
};

var store = proxyquire('../../lib/announcements/announcementstore.js', {'../persistence/persistence': function () {
  return persistenceStub;
}});

describe('Announcement store', function () {
  var announcement1 = {
    title: 'Neue Plattform ist online!',
    url: 'NeuePlattformistonline',
    text: '(Deutschland, Mai 2013) Seit heute ist die neueb Plattform namens „Agora“ unter http://www.softwerkskammer.de erreichbar.',
    author: 'Frank Deberle',
    thruDate: new Date(2013, 12, 31)
  };
  var announcement2 = {
    title: 'Server down',
    'url': 'Serverdown',
    text: 'Aus technischen Gründen ist der Server leider down. Die genauen Gründe sind noch unbekannt.',
    author: 'Nicole',
    thruDate: new Date(2013, 5, 31)
  };
  var sampleList = [announcement1, announcement2];
  var getByField = sinon.stub(persistenceStub, 'getByField');
  getByField.callsArgWith(1, null, announcement1);

  it('calls persistence.list for store.allAnnouncements and passes on the given callback', function (done) {
    var list = sinon.stub(persistenceStub, 'list');
    list.callsArgWith(1, null, sampleList);

    store.allAnnouncements(function (err, announcements) {
      announcements[0].title.should.equal(announcement1.title);
      announcements[1].title.should.equal(announcement2.title);
      done(err);
    });
  });

});
