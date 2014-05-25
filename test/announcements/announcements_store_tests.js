'use strict';
var expect = require('must');
var sinon = require('sinon').sandbox.create();

var beans = require('../../testutil/configureForTest').get('beans');
var persistence = beans.get('announcementsPersistence');
var store = beans.get('announcementstore');

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

  beforeEach(function () {
    sinon.stub(persistence, 'list', function (sortOrder, callback) {
      return callback(null, [announcement1, announcement2]);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('calls persistence.list for store.allAnnouncements and passes on the given callback', function (done) {
    store.allAnnouncements(function (err, announcements) {
      expect(announcements[0].title).to.equal(announcement1.title);
      expect(announcements[1].title).to.equal(announcement2.title);
      done(err);
    });
  });

});
