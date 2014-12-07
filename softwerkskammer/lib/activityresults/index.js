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

app.get('/:activityResultName/photo/:photoId/delete', function (req, res, next) {
  var activityResultName = req.params.activityResultName;
  if (!res.locals.accessrights.canDeletePhoto()) {
    return res.redirect(app.path() + activityResultName);
  }
  var photoId = req.params.photoId;
  activityresultsService.getActivityResultByName(activityResultName, function (err, activityResult) {
    activityresultsService.deletePhotoOfActivityResult(activityResult, photoId, function (err) {
      if (err) { return next(err); }
      galleryService.deleteImage(photoId, function (err) {
        if (err) {return next(err); }
        return res.redirect(app.path() + activityResultName);
      });
    });
  });
});

app.get('/:activityResultName/photo/:photoId/edit', function (req, res, next) {
  var activityResultName = req.params.activityResultName;
  activityresultsService.getActivityResultByName(activityResultName, function (err, activityResult) {
    if (err || !activityResult) { return next(err); }
    var model = {
      activityResult: activityResult,
      photo: activityResult.getPhotoById(req.params.photoId)
    };
    if (model.photo && res.locals.accessrights.canEditPhoto(model.photo)) {
      return res.render('edit_photo', model);
    }
    return res.redirect(app.path() + activityResultName);
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
      return res.render('get', {activityResult: activityResult});
    }
    return res.render('create', {activityResultName: activityResultName});
  });
});

module.exports = app;
