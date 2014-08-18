'use strict';

var Form = require('multiparty').Form;
var moment = require('moment-timezone');
var nconf = require('nconf');
var beans = nconf.get('beans');
var ActivityResult = beans.get('activityresult');
var activityresultsPersistence = beans.get('activityresultsPersistence');
var activityresultsService = beans.get('activityresultsService');
var galleryService = beans.get('galleryService');
var misc = beans.get('misc');
var galleryApp = beans.get('galleryApp');
var async = require('async');
var app = misc.expressAppIn(__dirname);
var logger = require('winston').loggers.get('application');

var _ = require('lodash');

app.use(function (req, res, next) {
  var colors = ['blue', 'green', 'red', 'yellow'];
  res.locals.getBackgroundForIndex = function getBackgroundForIndex(i) {
    return 'noisy_' + colors[i % colors.length];
  };
  next();
});

app.use(function (req, res, next) {
  res.locals.moment = moment;
  next();
});

app.use(function (req, res, next) {
  res.locals.shortenTitle = function shortenTitle(title) {
    if (!title) {
      return 'No title';
    }
    return title.length > 20 ? title.substring(0, 20) + '...' : title;
  };
  next();
});

app.post('/', function (req, res, next) {
  var activityResultName = req.body.activityResultName;
  if (!activityResultName) {
    return next(new Error('No Images')); // Sollte durch geeignete Prüfungen abgefangen werden. Siehe andere post Implementierungen (activities)
  }
  var tags = (req.body.tags || '').split(',');

  activityresultsPersistence.save(new ActivityResult({id: activityResultName, tags: tags, created_by: req.user.member.id }).state, function (err) {
    if (err) { return next(err); }
    res.redirect(app.path() + activityResultName);
  });
});

app.post('/:activityResultName/upload', function (req, res, next) {
  new Form().parse(req, function (err, fields, files) {
    if (!files) {
      return next(new Error('No Images')); // Sollte durch geeignete Prüfungen abgefangen werden. Siehe andere post Implementierungen (activities)
    }
    var image = files.image[0];

    async.waterfall([
      function (callback) { galleryService.storeImage(image.path, callback); },
      function (imageUri, callback) {
        galleryService.getMetadataForImage(imageUri, function (err, metadata) { callback(err, metadata, imageUri); });
      },
      function (metadata, imageUri, callback) {
        activityresultsService.addPhotoToActivityResult(req.params.activityResultName, metadata, imageUri, req.user.member.id(), function (err) { callback(err, imageUri); });
      }
    ], function (err, imageUri) {
      if (err) { return next(err); }
      res.redirect(app.path() + req.params.activityResultName + '/photo/' + imageUri + '/edit');
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

    if (model.photo.uploaded_by && model.photo.uploaded_by !== req.user.member.id()) {
      return res.redirect(app.path() + req.params.activityResultName);
    }

    return res.render('edit_photo', model);
  });
});

app.post('/:activityResultName/photo/:photoId/edit', function (req, res, next) {
  var photoData = {
    title: req.body.title,
    tags: misc.toArray(req.body.tag)
  };

  activityresultsService.getActivityResultByName(req.params.activityResultName, function (err, activityResult) {
    if (err || !activityResult) { return next(err); }

    var photo = activityResult.getPhotoById(req.params.photoId);
    if (!photo) { return next(err); }

    if (photo.uploaded_by && photo.uploaded_by !== req.user.member.id()) {
      return res.redirect(app.path() + req.params.activityResultName);
    }

    activityresultsService.updatePhotoOfActivityResult(req.params.activityResultName, req.params.photoId, photoData, function (err) {
      if (err) { return next(err); }
      res.redirect(app.path() + req.params.activityResultName);
    });
  });
});

app.get('/:activityResultName/print', function (req, res, next) {
  var activityResultName = req.params.activityResultName;
  activityresultsService.getActivityResultByName(activityResultName, function (err, activityResult) {
    if (err) { return next(err); }
    return res.render('print-codes', {
      activityResult: activityResult,
      activityResultUrl: nconf.get('publicUrlPrefix') + app.path() + activityResultName
    });
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

    function groupByDay(photo) {
      return moment(photo.timestamp).startOf('day').unix();
    }

    function groupByFirstTag(photo) {
      return (photo.tags && photo.tags[0]) || 'Everywhere';
    }

    function sortbyTimestamp(photo) {
      return photo.timestamp;
    }

    var groupedByDay = _(activityResult.photos()).sortBy(sortbyTimestamp).groupBy(groupByDay).value();

    var dayTimeStamps = _.keys(groupedByDay).reverse();

    var groupedByTag = _.transform(groupedByDay, function (intermediatePhotosGroupedByDay, photosOfDay, currentDay) {
      intermediatePhotosGroupedByDay[currentDay] = _.groupBy(photosOfDay, groupByFirstTag);
    });

    res.render('get', {
      activityResult: activityResult,
      recordImagePath: app.path() + activityResultName + '/upload',
      days: groupedByTag,
      dayTimeStamps: dayTimeStamps
    });
  });
});

module.exports = app;
