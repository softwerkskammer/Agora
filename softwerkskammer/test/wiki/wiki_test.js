'use strict';

const request = require('supertest');
const sinon = require('sinon').sandbox.create();
const expect = require('must-dist');

const beans = require('../../testutil/configureForTest').get('beans');
const wikiService = beans.get('wikiService');

const createApp = require('../../testutil/testHelper')('wikiApp').createApp;

describe('Wiki application', () => {

  let pageShow;
  const content = 'Hallo, ich bin der Dateiinhalt';
  const nonExistingPage = 'global/nonexisting';
  beforeEach(() => {
    pageShow = sinon.stub(wikiService, 'showPage',
      (completePageName, pageVersion, callback) => {
        if (completePageName === nonExistingPage) {
          return callback(new Error());
        }
        callback(null, content);
      });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('shows an existing page in wiki "global" when requested', done => {
    request(createApp())
      .get('/global/somepage')
      .expect(200)
      .expect(new RegExp(content))
      .end(err => {
        expect(pageShow.calledWith('global/somepage', 'HEAD')).to.be(true);
        done(err);
      });
  });

  it('normalizes page names', done => {
    request(createApp())
      .get('/global/Söme%20Päg\'é')
      .expect(200)
      .end(err => {
        expect(pageShow.calledWith('global/some-page', 'HEAD')).to.be(true);
        done(err);
      });
  });

  it('redirects to the group\'s index page when group directory is requested', done => {
    request(createApp())
      .get('/global/')
      .expect(302)
      .expect('Location', '/wiki/global/index')
      .end(err => {
        done(err);
      });
  });

  it('redirects to the index page of group "alle" when root is requested', done => {
    request(createApp())
      .get('/')
      .expect(302)
      .expect('Location', '/wiki/alle/index')
      .end(err => {
        done(err);
      });
  });

  it('redirects to the edit page of a page when the page does not exist yet and a user is logged in', done => {
    request(createApp({id: 'member'}))
      .get('/' + nonExistingPage)
      .expect(302)
      .expect('Location', '/wiki/edit/' + nonExistingPage)
      .end(err => {
        done(err);
      });
  });

  it('redirects to 404 page when the page does not exist yet and a user is not logged in', done => {
    request(createApp())
      .get('/' + nonExistingPage)
      .expect(404)
      .end(err => {
        done(err);
      });
  });
});

