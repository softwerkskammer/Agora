'use strict';

var Form = require('multiparty').Form;
var moment = require('moment-timezone');
var async = require('async');
var _ = require('lodash');

var nconf = require('nconf');
var beans = nconf.get('beans');
var ActivityResult = beans.get('activityresult');
var activityresultsPersistence = beans.get('activityresultsPersistence');
var activityresultsService = beans.get('activityresultsService');
var galleryService = beans.get('galleryService');
var misc = beans.get('misc');
var galleryApp = beans.get('galleryApp');
var fieldHelpers = beans.get('fieldHelpers');
var logger = require('winston').loggers.get('application');

var app = misc.expressAppIn(__dirname);

app.post('/', function (req, res, next) {
  var activityResultName = req.body.activityResultName;
  if (!activityResultName) {
    return next(new Error('No Images')); // Sollte durch geeignete Prüfungen abgefangen werden. Siehe andere post Implementierungen (activities)
  }
  var tags = (req.body.tags || '').split(',');

  activityresultsPersistence.save(new ActivityResult({
    id: activityResultName,
    tags: tags,
    created_by: req.user.member.id
  }).state, function (err) {
    if (err) { return next(err); }
    res.redirect(app.path() + activityResultName);
  });
});

app.post('/:activityResultName/upload', function (req, res, next) {
  var activityResultName = req.params.activityResultName;
  new Form().parse(req, function (err, fields, files) {
    if (err || !files) {
      return res.redirect(app.path() + activityResultName); // Es fehlen Prüfungen im Frontend
    }
    var image = files.image[0];

    async.waterfall([
      function (callback) { galleryService.storeImage(image.path, callback); },
      function (imageUri, callback) {
        galleryService.getMetadataForImage(imageUri, function (err, metadata) { callback(err, metadata, imageUri); });
      },
      function (metadata, imageUri, callback) {
        activityresultsService.addPhotoToActivityResult(activityResultName, metadata, imageUri, req.user.member.id(), function (err) { callback(err, imageUri); });
      }
    ], function (err, imageUri) {
      if (err) { return next(err); }
      res.redirect(app.path() + activityResultName + '/photo/' + imageUri + '/edit');
    });
  });
});

app.get('/:activityResultName/photo/:photoId/edit', function (req, res, next) {
  activityresultsService.getActivityResultByName(req.params.activityResultName, function (err, activityResult) {
    if (err || !activityResult) { return next(err); }
    var model = {
      activityResult: activityResult,
      photo: activityResult.getPhotoById(req.params.photoId)
    };
    if (res.locals.accessrights.canEditPhoto(model.photo)) {
      return res.render('edit_photo', model);
    }
    return res.redirect(app.path() + req.params.activityResultName);
  });
});

app.post('/:activityResultName/photo/:photoId/edit', function (req, res, next) {
  var photoId = req.params.photoId;
  var activityResultName = req.params.activityResultName;
  var photoData = {
    title: req.body.title,
    tags: misc.toArray(req.body.tags),
    timestamp: fieldHelpers.parseToMomentUsingDefaultTimezone(req.body.date, req.body.time).toDate()
  };

  activityresultsService.getActivityResultByName(activityResultName, function (err, activityResult) {
    if (err || !activityResult) { return next(err); }

    var photo = activityResult.getPhotoById(photoId);
    if (!photo) { return next(err); }

    if (res.locals.accessrights.canEditPhoto(photo)) {
      return activityresultsService.updatePhotoOfActivityResult(activityResult, photoId, photoData, function (err) {
        if (err) { return next(err); }
        res.redirect(app.path() + activityResultName);
      });
    }
    return res.redirect(app.path() + activityResultName);
  });
});

app.get('/:activityResultName', function (req, res, next) {
  var activityResultName = req.params.activityResultName;
  activityresultsService.getActivityResultByName(activityResultName, function (err, activityResult) {
    if (err) { return next(err); }
    if (!activityResult) {
      return res.render('notFound', {
        createUri: app.path(),
        activityResultName: activityResultName
      });
    }

    function unixTimeOfDay(photo) {
      return photo.time().startOf('day').valueOf();
    }

    function groupByFirstTag(photo) {
      return photo.tags()[0] || 'Everywhere';
    }

    function timestamp(photo) {
      return photo.time();
    }

    var groupedByDay = _(activityResult.photos()).sortBy(timestamp).groupBy(unixTimeOfDay).value();

    var dayTimeStamps = _(groupedByDay).keys().map(function (timestamp) { return moment(parseInt(timestamp, 10)); }).reverse().value();

    var groupedByTag = _.transform(groupedByDay, function (intermediatePhotosGroupedByDay, photosOfDay, currentDay) {
      intermediatePhotosGroupedByDay[currentDay] = _.groupBy(photosOfDay, groupByFirstTag);
    });

    res.render('get', {
      activityResult: activityResult,
      days: groupedByTag,
      dayTimeStamps: dayTimeStamps
    });
  });
});

module.exports = app;
