'use strict';

var Form = require('multiparty').Form;

var beans = require('simple-configure').get('beans');
var ActivityResult = beans.get('activityresult');
var activityresultsPersistence = beans.get('activityresultsPersistence');
var activityresultsService = beans.get('activityresultsService');
var misc = beans.get('misc');
var fieldHelpers = beans.get('fieldHelpers');

var app = misc.expressAppIn(__dirname);

app.post('/', function (req, res, next) {
  /* eslint camelcase: 0 */
  var activityResultName = req.body.activityResultName;
  if (!activityResultName) {
    return next(new Error('No Images')); // Sollte durch geeignete Prüfungen abgefangen werden. Siehe andere post Implementierungen (activities)
  }
  var tags = misc.toArray(req.body.tags);

  activityresultsPersistence.save(new ActivityResult({
    id: activityResultName,
    tags: tags,
    uploaded_by: req.user.member.id
  }).state, function (err) {
    if (err) { return next(err); }
    res.redirect(app.path() + activityResultName);
  });
});

app.post('/:activityResultName/upload', function (req, res, next) {
  var activityResultName = req.params.activityResultName;
  new Form().parse(req, function (err, fields, files) {
    if (err || !files || files.length < 1) {
      return res.redirect(app.path() + activityResultName); // Es fehlen Prüfungen im Frontend
    }
    activityresultsService.addPhotoToActivityResult(activityResultName, files.image[0], req.user.member.id(), function (err1, imageUri) {
      if (err1) { return next(err1); }
      res.redirect(app.path() + activityResultName + '/photo/' + imageUri + '/edit');
    });

  });
});

app.post('/delete', function (req, res, next) {
  var activityResultName = req.body.activityresults;
  var photoId = req.body.photo;
  if (res.locals.accessrights.canDeletePhoto()) {
    return activityresultsService.deletePhotoOfActivityResult(activityResultName, photoId, function (err) {
      if (err) { return next(err); }
      res.redirect(app.path() + activityResultName);
    });
  }
  res.redirect(app.path() + activityResultName);
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
    res.redirect(app.path() + activityResultName);
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

  activityresultsService.updatePhotoOfActivityResult(activityResultName, photoId, photoData, res.locals.accessrights, function (err) {
    if (err) { return next(err); }
    res.redirect(app.path() + activityResultName);
  });

});

app.get('/:activityResultName', function (req, res, next) {
  var activityResultName = req.params.activityResultName;
  activityresultsService.getActivityResultByName(activityResultName, function (err, activityResult) {
    if (err) { return next(err); }
    if (activityResult) {
      return res.render('get', {activityResult: activityResult});
    }
    return res.render('create', {activityResultName: activityResultName});
  });
});

module.exports = app;
