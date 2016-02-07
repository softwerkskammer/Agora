'use strict';

var expect = require('must-dist');
var sinon = require('sinon').sandbox.create();

var beans = require('../../testutil/configureForTest').get('beans');
var Member = beans.get('member');
var avatarProvider = beans.get('avatarProvider');

describe('AvatarProvider', function () {

  afterEach(function () {
    sinon.restore();
  });

  it('loads the gravatar of "leider" from gravatar', function (done) {
    var member = new Member({email: 'derleider@web.de'});
    avatarProvider.getImage(member, function () {
      expect(member.inlineAvatar()).to.be('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2ODApLCBxdWFsaXR5ID0gOTAK/9sAQwADAgIDAgIDAwMDBAMDBAUIBQUEBAUKBwcGCAwKDAwLCgsLDQ4SEA0OEQ4LCxAWEBETFBUVFQwPFxgWFBgSFBUU/9sAQwEDBAQFBAUJBQUJFA0LDRQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQU/8AAEQgAEAAQAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A+Nbfx5ZS+CbDStCha1gg8mzvUkLAyyOjvK/3iCC6cEjgcACun1X4N3WjeG01s6hp92gj82e1t5D5sC985ADFe+0nHvXiXgS9S08W2dxPbpe263ccj2rICr4bOMenJ4r2bX/EVveLeadqdgmmu7tFbizkUbo8kkMF4ORu+9k9ugFeDiFLDzjGgvid31b/ACf+SPbw8IYqE515fCrLolp6P/gn/9k=');
      expect(member.hasNoImage).to.be(false);
      done();
    });
  });

  it('defaults to no image if address has no gravatar', function (done) {
    var member = new Member({email: 'derleider@web.dede'});
    avatarProvider.getImage(member, function () {
      expect(member.inlineAvatar()).to.be('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAABnRSTlMAAAAAAABupgeRAAAAEElEQVQokWNgGAWjYBTAAAADEAABC3uRhAAAAABJRU5ErkJggg==');
      expect(member.hasNoImage).to.be(true);
      done();
    });
  });

  it('defaults to "null" image if garvatar errors', function (done) {
    var member = new Member({email: 'derleider@web.de'});
    avatarProvider.getImage(member, function () {
      expect(member.inlineAvatar()).to.be('');
      expect(member.hasNoImage).to.be(true);
      done();
    }, 'http://nonexisting.site');
  });

});

