/*global describe, it*/
"use strict";
require('./configureForTest');
var request = require('supertest'),
  express = require('express');

var app = require('../lib/filebrowser')(express());
describe('File browser application', function () {

  it('sends page not found if root is not known', function (done) {
    var root = express();
    root.use('/foo', app);
    request(root)
      .get('/foo/root1/filebrowser-testfiles/subdirectory/')
      .expect(404, done);
  });

  it('recognizes path and root from the url', function (done) {
    var root = express();
    root.use('/foo', app);
    request(root)
      .get('/foo/root/subdirectory/')
      .expect(/Root root/)
      .expect(/.\/test\/filebrowser-testfiles\/subdirectory/)
      .expect(200, done);
  });

  it('accepts empty path', function (done) {
    var root = express();
    root.use('/foo', app);
    request(root)
      .get('/foo/root/')
      .expect(/Root root/)
      .expect(/Path .\/test\/filebrowser-testfiles/)
      .expect(200, done);
  });

  it('lists all files with hrefs', function (done) {
    var root = express();
    root.use('/foo', app);
    request(root)
      .get('/foo/root/')
      .expect(/file&nbsp;<a href="hello1.html">hello1.html/)
      .expect(/file&nbsp;<a href="hello1.html">hello1.html/)
      .expect(200, done);
  });

  it('lists all subdirectories with hrefs', function (done) {
    var root = express();
    root.use('/foo', app);
    request(root)
      .get('/foo/root/')
      .expect(/dir&nbsp;<a href="subdirectory">subdirectory/)
      .expect(200, done);
  });

  it('has links to child files and subdirectories', function (done) {
    var root = express();
    root.use('/foo', app);
    request(root)
      .get('/foo/root/')
      .expect(/href="hello1.html"/)
      .expect(/href="hello2.html"/)
      .expect(/href="subdirectory"/)
      .expect(200, done);
  });

  it('adds trailing slash to subdirectory names', function (done) {
    var root = express();
    root.use('/foo', app);
    request(root)
      .get('/foo/root/subdirectory')
      .expect(/foo\/root\/subdirectory\//)
      .expect(302, done);
  });

  it('has links to parent directories for subdirectories', function (done) {
    var root = express();
    root.use('/foo', app);
    request(root)
      .get('/foo/root/subdirectory/')
      .expect(/href=".."/)
      .expect(200, done);
  });

  it('has links to directories for files', function (done) {
    var root = express();
    root.use('/foo', app);
    request(root)
      .get('/foo/root/subdirectory/hello3.html')
      .expect(/href="."/)
      .expect(200, done);
  });

  it('outputs file content', function (done) {
    var root = express();
    root.use('/foo', app);
    request(root)
      .get('/foo/root/hello1.html')
      .expect(/<div>hello1 content<\/div>/)
      .expect(200, done);
  });


});
