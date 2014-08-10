'use strict';
var nconf = require('nconf');
var beans = nconf.get('beans');
var ActivityResult = beans.get('activityresult');
var activityresultsPersistence = beans.get('activityresultsPersistence');
var activityresultsService = beans.get('activityresultsService');
var galleryRepository = beans.get('galleryrepositoryService');
var misc = beans.get('misc');
var Form = require('multiparty').Form;
var uuid = require('node-uuid');
var galleryApp = beans.get('galleryApp');
var moment = require("moment-timezone");

var app = misc.expressAppIn(__dirname);
var logger = require('winston').loggers.get('application');

var ld = require("lodash");

var CREATED = 201;

var BAD_REQUEST = 400;
var NOT_FOUND = 404;


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
      return "No title";
    }
    return title.length > 20 ? title.substring(0, 20) + '...' : title;
  };
  next();
});

app.post('/', function (req, res) {
  var activityResultName = req.body.activityResultName;
  if (!activityResultName) {
    return res.send(BAD_REQUEST);
  }
  activityresultsPersistence.save(new ActivityResult({id: activityResultName, created_by: req.user.member.id }), function (err) {
    if (err) {
      return res.send(BAD_REQUEST);
    }
    res.location(app.path() + activityResultName);
    res.send(303);
  });
});

app.post("/:activityResultName/upload", function (req, res) {
  new Form().parse(req, function (err, fields, files) {
    if (!files) {
      return res.send(400);
    }
    var image = files.image[0];
    galleryRepository.storeImage(image.path, function (err, imageUri) {
      if (err) {
        throw err;
      }
      galleryRepository.getMetadataForImage(imageUri, function (err, metadata) {
        var date;
        if (metadata && metadata.exif) {
          date = metadata.exif.dateTime ||
                 metadata.exif.dateTimeOriginal ||
                 metadata.exif.dateTimeDigitized ||
                 new Date();
        } else {
          date = new Date();
        }
        date = moment.min(moment(), moment(date)).toDate();

        var newPhoto = {
          id: uuid.v4(),
          uri: galleryApp.path() + imageUri,
          timestamp: date,
          uploaded_by: req.user.member.id()
        };

        activityresultsService.addPhotoToActivityResult(req.params.activityResultName, newPhoto, function (err) {
          res.location(app.path() + req.params.activityResultName + '/photo/' + newPhoto.id + '/edit');
          res.send(303);
        });
      });
    });
  });
});

app.get("/:activityResultName/photo/:photoId/edit", function (req, res) {
  activityresultsService.getActivityResultByName(req.params.activityResultName, function (err, activityResult) {
    if (err || !activityResult) {
      return res.send(404);
    }
    var model = {
      activityResult: activityResult,
      photo: activityResult.getPhotoById(req.params.photoId)
    };

    if (model.photo.uploaded_by && model.photo.uploaded_by !== req.user.member.id()) {
      return res.send(403);
    }

    return res.render("edit_photo", model);
  });
});

app.post('/:activityResultName/photo/:photoId/edit', function (req, res) {
  var photoData = {
    title: req.body.title,
    tags: ld.isArray(req.body.tag) ? req.body.tag : [req.body.tag]
  };

  activityresultsService.getActivityResultByName(req.params.activityResultName, function (err, activityResult) {
    if (err || !activityResult) {
      return res.send(404);
    }

    var photo = activityResult.getPhotoById(req.params.photoId);
    if (!photo) {
      return res.send(404);
    }

    if (photo.uploaded_by && photo.uploaded_by !== req.user.member.id()) {
      return res.send(403);
    }

    activityresultsService.updatePhotoOfActivityResult(req.params.activityResultName, req.params.photoId, photoData, function (err) {
      if (err) {
        return res.send(400);
      }
      res.location(app.path() + req.params.activityResultName);
      res.send(303);
    });
  });
});

app.get('/:activityResultName/print', function (req, res) {
  var activityResultName = req.params.activityResultName;
  activityresultsService.getActivityResultByName(activityResultName, function (err, activityResult) {
    return res.render('print-codes', {
      activityResult: activityResult,
      activityResultUrl: nconf.get('publicUrlPrefix') + app.path() + activityResultName
    });
  });
});

app.get('/:activityResultName', function (req, res) {
  var activityResultName = req.params.activityResultName;
  activityresultsService.getActivityResultByName(activityResultName, function (err, activityResult) {
    if (err || !activityResult) {
      res.status(NOT_FOUND);
      return res.render('notFound', {
        createUri: app.path(),
        activityResultName: activityResultName
      });
    }

    function groupByDay(photo) {
      return moment(photo.timestamp).startOf('day').unix();
    }

    function groupByFirstTag(photo) {
      return photo.tags && photo.tags[0] !== null ? photo.tags[0] : "Everywhere";
    }

    function sortbyTimestamp(photo) {
      return photo.timestamp;
    }

    var groupedByDay = ld.groupBy(ld.sortBy(activityResult.photos, sortbyTimestamp), groupByDay);

    var dayTimeStamps = ld.keys(groupedByDay).reverse();

    var groupedByTag = ld.transform(groupedByDay, function (intermediatePhotosGroupedByDay, photosOfDay, currentDay) {
      intermediatePhotosGroupedByDay[currentDay] = ld.groupBy(photosOfDay, groupByFirstTag);
    });

    res.render('get', {
      activityResultName: activityResult.id,
      recordImagePath: app.path() + activityResultName + '/upload',
      days: groupedByTag,
      dayTimeStamps: dayTimeStamps
    });
  });
});

module.exports = app;
