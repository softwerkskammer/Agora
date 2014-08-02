'use strict';
var beans = require('nconf').get('beans');
var ActivityResult = beans.get('activityresult');
var activityresultsPersistence = beans.get('activityresultsPersistence');
var activityresultsService = beans.get('activityresultsService');
var galleryRepository = beans.get('galleryrepositoryService');
var misc = beans.get('misc');
var Form = require('multiparty').Form;
var uuid = require('node-uuid');
var galleryApp = beans.get('galleryApp');

var app = misc.expressAppIn(__dirname);
var logger = require('winston').loggers.get('application');

var ld = require("lodash");

var CREATED = 201;

var BAD_REQUEST = 400;
var NOT_FOUND = 404;


app.post('/', function (req, res) {
  var activityResultName = req.body.activityResultName;
  if (!activityResultName) {
    return res.send(BAD_REQUEST);
  }
  activityresultsPersistence.save(new ActivityResult({id: activityResultName }), function (err) {
    if (err) {
      return res.send(BAD_REQUEST);
    }
    res.location(app.path() + activityResultName);
    res.send(303);
  });
});

app.get("/:activityResultName/upload", function (req, res) {
  activityresultsService.getActivityResultByName(req.params.activityResultName, function (err, activityResult) {
    if (err || !activityResult) {
      res.status(NOT_FOUND);
      return res.render('notFound', {
        createUri: app.path(),
        activityResultName: req.params.activityResultName
      });
    }

    res.render('upload', {
      activityResultName: activityResult.id
    });
  });
});

app.post("/:activityResultName/upload", function (req, res) {
  new Form().parse(req, function (err, fields, files) {
    var image = files.image[0];
    galleryRepository.storeImage(image.path, function (err, imageUri) {
      if (err) {
        throw err;
      }
      galleryRepository.getMetadataForImage(imageUri, function (err, metadata) {
        var date;
        console.dir(metadata);
        if (metadata && metadata.exif) {
          date = metadata.exif.dateTime || metadata.exif.dateTimeOriginal || metadata.exif.dateTimeDigitized;
        }

        var newPhoto = {
          id: uuid.v4(),
          uri: galleryApp.path() + imageUri,
          timestamp: date
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
    return res.render("edit_photo", model);
  });
});

app.post('/:activityResultName/photo/:photoId/edit', function (req, res) {
  var photoData = {
    title: req.body.title,
    tags: req.body.tag
  };

  activityresultsService.updatePhotoOfActivityResult(req.params.activityResultName, req.params.photoId, photoData, function (err) {
    if (err) {
      return res.send(400);
    }
    res.location(app.path() + req.params.activityResultName);
    res.send(303);
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

    var sortedByFirstTag = ld.groupBy(activityResult.photos, function (photo) {
      if (!photo.tags || photo.tags.length === 0) {
        return "NOT_TAGGED";
      }
      return photo.tags[0];
    });

    var asColumns = ld.map(ld.keys(sortedByFirstTag), function (tag) {
      return {
        columnTitle: tag,
        images: sortedByFirstTag[tag]
      };
    });

    res.render('get', {
      activityResultName: activityResult.id,
      columns: asColumns
    });
  });
});

module.exports = app;