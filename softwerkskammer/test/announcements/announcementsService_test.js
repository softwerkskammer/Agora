'use strict';

var expect = require('must-dist');
var sinon = require('sinon').sandbox.create();

var beans = require('../../testutil/configureForTest').get('beans');
var Announcement = beans.get('announcement');
var memberstore = beans.get('memberstore');
var Member = beans.get('member');

var announcementUrl = 'eineSchoeneUrl';
var dummyAnnouncement = new Announcement({
  title: 'title',
  url: announcementUrl,
  text: 'text',
  author: 'author',
  fromUnix: 1372464000, // moment.utc('29.06.2013', 'DD.MM.YYYY').unix()
  thruUnix: 1388448000 // moment.utc('31.12.2013', 'DD.MM.YYYY').unix()
});

var store = beans.get('announcementstore');

var announcementsService = beans.get('announcementsService');

describe('Announcements Service', function () {

  beforeEach(function () {
    sinon.stub(store, 'saveAnnouncement', function (announcement, callback) {
      callback(null);
    });
    sinon.stub(store, 'getAnnouncement', function (url, callback) {
      if (url === announcementUrl) {
        return callback(null, dummyAnnouncement);
      }
      callback(null, null);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('rejects urls that are reserved', function () {
    expect(announcementsService.isReserved('edit')).to.be(true);
    expect(announcementsService.isReserved('eDit')).to.be(true);
    expect(announcementsService.isReserved('neW')).to.be(true);
    expect(announcementsService.isReserved('checkurl')).to.be(true);
    expect(announcementsService.isReserved('submIt')).to.be(true);
    expect(announcementsService.isReserved('administration')).to.be(true);
  });

  it('accepts untrimmed versions of reserved words', function (done) {
    announcementsService.isValidUrl(' checkurl ', function (err, result) {
      expect(result).to.be(true);
      done(err);
    });
  });


  it('accepts a valid url', function (done) {
    announcementsService.isValidUrl('thisIsAValidUrl', function (err, result) {
      expect(result).to.be(true);
      done(err);
    });
  });

  it('rejects an url with "/"', function (done) {
    announcementsService.isValidUrl('valid/', function (err, result) {
      expect(result).to.be(false);
      done(err);
    });
  });

  it('rejects an invalid url', function (done) {
    announcementsService.isValidUrl('edit', function (err, result) {
      expect(result).to.be(false);
      done(err);
    });
  });

  it('creates an id out of the fields `author`, `title` and `timeUnix` when saving', function (done) {
    announcementsService.saveAnnouncement(dummyAnnouncement, function (err) {
      expect(dummyAnnouncement).to.have.property('id', 'author_title_1372464000');
      done(err);
    });
  });

  it('converts a German date to unix timestamp when saving', function () {
    var object = {
      title: 'title',
      url: announcementUrl,
      text: 'text',
      author: 'author',
      thruDate: '31.12.2013'
    };
    var result = new Announcement(object);
    expect(result.thruUnix).to.equal(1388448000);
  });

  it('displays member\'s nickname as author name', function (done) {
    var dummyMember = new Member({nickname: 'nickname', id: 'member ID'});
    sinon.stub(memberstore, 'getMemberForId', function (id, callback) {
      callback(null, dummyMember);
    });
    announcementsService.getAuthorName(dummyAnnouncement, function (err, name) {
      expect(name).to.equal('nickname');
      done(err);
    });
  });

  it('displays "automatisch" as author name when the authorname is empty', function (done) {
    dummyAnnouncement.author = '';
    announcementsService.getAuthorName(dummyAnnouncement, function (err, name) {
      expect(name).to.equal('automatisch');
      done(err);
    });
  });

  it('displays "automatisch" as author name when there is no author', function (done) {
    dummyAnnouncement.author = null;
    announcementsService.getAuthorName(dummyAnnouncement, function (err, name) {
      expect(name).to.equal('automatisch');
      done(err);
    });
  });

});
