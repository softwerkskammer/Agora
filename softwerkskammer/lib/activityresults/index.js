const Form = require("multiparty").Form;

const beans = require("simple-configure").get("beans");
const ActivityResult = beans.get("activityresult");
const activityresultsPersistence = beans.get("activityresultsPersistence");
const activityresultsService = beans.get("activityresultsService");
const misc = beans.get("misc");
const fieldHelpers = beans.get("fieldHelpers");

const app = misc.expressAppIn(__dirname);

app.post("/", async (req, res, next) => {
  /* eslint camelcase: 0 */
  let activityResultName = req.body.activityResultName;
  if (!activityResultName) {
    return next(new Error("No Images")); // Sollte durch geeignete Prüfungen abgefangen werden. Siehe andere post Implementierungen (activities)
  }
  const tags = misc.toArray(req.body.tags);

  await activityresultsPersistence.saveMongo(
    new ActivityResult({
      id: activityResultName,
      tags,
      uploaded_by: req.user.member.id,
    }).state
  );
  res.redirect(app.path() + activityResultName);
});

app.post("/:activityResultName/upload", async (req, res) => {
  const promisifyUpload = (req1) =>
    new Promise((resolve, reject) => {
      new Form().parse(req1, function (err, fields, files) {
        if (!files || files.length < 1) {
          return null; // indicate no result
        }
        if (err) {
          return reject(err);
        }

        return resolve(files);
      });
    });

  const activityResultName = req.params.activityResultName;
  const files = await promisifyUpload(req);
  const imageUri = await activityresultsService.addPhotoToActivityResult(
    activityResultName,
    files.image[0],
    req.user.member.id()
  );
  res.redirect(app.path() + activityResultName + "/photo/" + imageUri + "/edit");
});

app.post("/delete", async (req, res) => {
  const activityResultName = req.body.activityresults;
  const photoId = req.body.photo;
  if (res.locals.accessrights.canDeletePhoto()) {
    await activityresultsService.deletePhotoOfActivityResult(activityResultName, photoId);
  }
  res.redirect(app.path() + activityResultName);
});

app.get("/:activityResultName/photo/:photoId/edit", async (req, res, next) => {
  const activityResultName = req.params.activityResultName;
  const activityResult = await activityresultsService.getActivityResultByName(activityResultName);
  if (!activityResult) {
    return next();
  }
  const model = {
    activityResult,
    photo: activityResult.getPhotoById(req.params.photoId),
  };
  if (model.photo && res.locals.accessrights.canEditPhoto(model.photo)) {
    return res.render("edit_photo", model);
  }
  res.redirect(app.path() + activityResultName);
});

app.post("/:activityResultName/photo/:photoId/edit", async (req, res) => {
  const photoId = req.params.photoId;
  const activityResultName = req.params.activityResultName;
  const photoData = {
    title: req.body.title,
    tags: misc.toArray(req.body.tags),
    timestamp: fieldHelpers.parseToDateTimeUsingDefaultTimezone(req.body.date, req.body.time).toJSDate(),
  };

  await activityresultsService.updatePhotoOfActivityResult(
    activityResultName,
    photoId,
    photoData,
    res.locals.accessrights
  );
  res.redirect(app.path() + activityResultName);
});

app.get("/:activityResultName", async (req, res) => {
  const activityResultName = req.params.activityResultName;
  const activityResult = await activityresultsService.getActivityResultByName(activityResultName);
  if (activityResult) {
    return res.render("get", { activityResult });
  }
  return res.render("create", { activityResultName });
});

module.exports = app;
