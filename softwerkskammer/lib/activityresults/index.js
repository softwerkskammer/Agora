const Form = require('multiparty').Form;

const beans = require('simple-configure').get('beans');
const ActivityResult = beans.get('activityresult');
const activityresultsPersistence = beans.get('activityresultsPersistence');
const activityresultsService = beans.get('activityresultsService');
const misc = beans.get('misc');
const fieldHelpers = beans.get('fieldHelpers');

const app = misc.expressAppIn(__dirname);

app.post('/', (req, res, next) => {
  /* eslint camelcase: 0 */
  let activityResultName = req.body.activityResultName;
  if (!activityResultName) {
    return next(new Error('No Images')); // Sollte durch geeignete Prüfungen abgefangen werden. Siehe andere post Implementierungen (activities)
  }
  const tags = misc.toArray(req.body.tags);

  activityresultsPersistence.save(new ActivityResult({
    id: activityResultName,
    tags,
    uploaded_by: req.user.member.id
  }).state, err => {
    if (err) { return next(err); }
    res.redirect(app.path() + activityResultName);
  });
});

app.post('/:activityResultName/upload', (req, res, next) => {
  const activityResultName = req.params.activityResultName;
  new Form().parse(req, (err, fields, files) => {
    if (err || !files || files.length < 1) {
      return res.redirect(app.path() + activityResultName); // Es fehlen Prüfungen im Frontend
    }
    activityresultsService.addPhotoToActivityResult(activityResultName, files.image[0], req.user.member.id(), (err1, imageUri) => {
      if (err1) { return next(err1); }
      res.redirect(app.path() + activityResultName + '/photo/' + imageUri + '/edit');
    });

  });
});

app.post('/delete', (req, res, next) => {
  const activityResultName = req.body.activityresults;
  const photoId = req.body.photo;
  if (res.locals.accessrights.canDeletePhoto()) {
    return activityresultsService.deletePhotoOfActivityResult(activityResultName, photoId, err => {
      if (err) { return next(err); }
      res.redirect(app.path() + activityResultName);
    });
  }
  res.redirect(app.path() + activityResultName);
});

app.get('/:activityResultName/photo/:photoId/edit', (req, res, next) => {
  const activityResultName = req.params.activityResultName;
  activityresultsService.getActivityResultByName(activityResultName, (err, activityResult) => {
    if (err || !activityResult) { return next(err); }
    const model = {
      activityResult,
      photo: activityResult.getPhotoById(req.params.photoId)
    };
    if (model.photo && res.locals.accessrights.canEditPhoto(model.photo)) {
      return res.render('edit_photo', model);
    }
    res.redirect(app.path() + activityResultName);
  });
});

app.post('/:activityResultName/photo/:photoId/edit', (req, res, next) => {
  const photoId = req.params.photoId;
  const activityResultName = req.params.activityResultName;
  const photoData = {
    title: req.body.title,
    tags: misc.toArray(req.body.tags),
    timestamp: fieldHelpers.parseToDateTimeUsingDefaultTimezone(req.body.date, req.body.time).toJSDate()
  };

  activityresultsService.updatePhotoOfActivityResult(activityResultName, photoId, photoData, res.locals.accessrights, err => {
    if (err) { return next(err); }
    res.redirect(app.path() + activityResultName);
  });

});

app.get('/:activityResultName', (req, res, next) => {
  const activityResultName = req.params.activityResultName;
  activityresultsService.getActivityResultByName(activityResultName, (err, activityResult) => {
    if (err) { return next(err); }
    if (activityResult) {
      return res.render('get', {activityResult});
    }
    return res.render('create', {activityResultName});
  });
});

module.exports = app;
