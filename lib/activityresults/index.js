'use strict';
var beans = require('nconf').get('beans');
var ActivityResult = beans.get('activityresult');
var activityresultsPersistence = beans.get('activitiesPersistence');
var activityresultsService = beans.get('activityresultsService');
var misc = beans.get('misc');

var app = misc.expressAppIn(__dirname);
var logger = require('winston').loggers.get('application');

var CREATED = 201;

var BAD_REQUEST = 400;
var NOT_FOUND = 404;


app.post('/', function (req, res) {
  var activityResultName = req.body.activityResultName;
  if (!activityResultName) {
    return res.send(BAD_REQUEST);
  }
  // TODO Save the new activityResult
  activityresultsPersistence.save(new ActivityResult({
    id: activityResultName,
    photos: [
      { uri: '/gallery/fef400b5-2a1f-4f6d-86b7-d5b5716711ba.JPG' },
      { uri: '/gallery/73120aa1-80b1-4f2f-a342-4b03abc665e5.JPG' },
      { uri: '/gallery/a24a1d14-8936-403f-91d7-c6ba36343cc7.JPG' },
      { uri: '/gallery/cba13ad5-43fc-485d-a73b-7adb0138debe.JPG' },
      { uri: '/gallery/5ca87f1d-0de0-4371-9de0-1c755fc1b9c1.JPG' },
      { uri: '/gallery/250b1910-663c-4bb1-a0d6-4d5ed89d040d.JPG' },
      { uri: '/gallery/e63b12ee-48ef-4126-af2c-9f87dd68bf4b.JPG' },
      { uri: '/gallery/9aa23ef0-6565-457f-8d91-9922f22ba292.JPG' },
      { uri: '/gallery/e766dcbc-e2da-4e72-928f-d67b9717f261.JPG' },
      { uri: '/gallery/ad1f8bea-1785-4912-9b88-96f3cbe4b978.JPG' },
      { uri: '/gallery/9475905d-b979-4296-af47-ac0164788a1a.JPG' },
      { uri: '/gallery/fdd09e6d-baf1-4c44-a767-a786d22002bd.JPG' },
      { uri: '/gallery/85f9a5c1-46a5-470d-b3d2-fda330537457.JPG' },
      { uri: '/gallery/1806f88e-8ed7-4b3e-92bd-3173c9965541.JPG' },
      { uri: '/gallery/fc7ea3d4-9e4d-46cf-885c-2f9a98bfa058.JPG' },
      { uri: '/gallery/627adb49-b7ef-4765-94b9-d094463007a6.JPG' },
      { uri: '/gallery/9afcfea0-1aa4-41c1-9f8c-6dba1e16d6c4.JPG' }
    ]
  }));
  res.location(app.path() + activityResultName);
  res.send(CREATED);
});

// TODO Merge into general get /:activityResultName
app.get('/MOBenSpace-2014-2', function (req, res) {
  res.render('mobenspace', {
    activityResultName: 'MOBenSpace 2014.2',
    columns: {
      0: {
        columnTitle: '#Hopper',
        images: [
          { 'uri': '/gallery/fef400b5-2a1f-4f6d-86b7-d5b5716711ba.JPG', 'margin-top': '0px' },
          { 'uri': '/gallery/73120aa1-80b1-4f2f-a342-4b03abc665e5.JPG', 'margin-top': '13px;' },
          { 'uri': '/gallery/a24a1d14-8936-403f-91d7-c6ba36343cc7.JPG', 'margin-top': '12px;' },
          { 'uri': '/gallery/cba13ad5-43fc-485d-a73b-7adb0138debe.JPG', 'margin-top': '20px;' }
        ]

      },
      1: {
        columnTitle: '#Liskov',
        images: [
          { 'uri': '/gallery/5ca87f1d-0de0-4371-9de0-1c755fc1b9c1.JPG', 'margin-top': '20px' },
          { 'uri': '/gallery/250b1910-663c-4bb1-a0d6-4d5ed89d040d.JPG', 'margin-top': '10px' },
          { 'uri': '/gallery/e63b12ee-48ef-4126-af2c-9f87dd68bf4b.JPG', 'margin-top': '10px' }
        ]
      },
      2: {
        columnTitle: '#Lovelace',
        images: [
          { 'uri': '/gallery/9aa23ef0-6565-457f-8d91-9922f22ba292.JPG', 'margin-top': '15px' },
          { 'uri': '/gallery/e766dcbc-e2da-4e72-928f-d67b9717f261.JPG', 'margin-top': '10px' },
          { 'uri': '/gallery/ad1f8bea-1785-4912-9b88-96f3cbe4b978.JPG', 'margin-top': '10px' },
          { 'uri': '/gallery/9afcfea0-1aa4-41c1-9f8c-6dba1e16d6c4.JPG', 'margin-top': '10px' }
        ]
      },
      3: {
        columnTitle: '#Elsewhere',
        images: [
          { 'uri': '/gallery/9475905d-b979-4296-af47-ac0164788a1a.JPG', 'margin-top': '30px' },
          { 'uri': '/gallery/fdd09e6d-baf1-4c44-a767-a786d22002bd.JPG', 'margin-top': '10px' },
          { 'uri': '/gallery/85f9a5c1-46a5-470d-b3d2-fda330537457.JPG', 'margin-top': '10px' },
          { 'uri': '/gallery/1806f88e-8ed7-4b3e-92bd-3173c9965541.JPG', 'margin-top': '10px' },
          { 'uri': '/gallery/fc7ea3d4-9e4d-46cf-885c-2f9a98bfa058.JPG', 'margin-top': '10px' },
          { 'uri': '/gallery/627adb49-b7ef-4765-94b9-d094463007a6.JPG', 'margin-top': '10px' }
        ]
      }
    }

  });
});

app.get('/:activityResultName', function (req, res) {
  activityresultsService.getActivityResultByName(req.params.activityResultName, function (err, activityResult) {
    if (err || !activityResult) {
      res.status(NOT_FOUND);
      return res.render('notFound', {
        createUri: app.path(),
        activityResultName: req.params.activityResultName
      });
    }

    res.render('get', {
      activityResultName: activityResult.id
    });
  });
});

module.exports = app;
