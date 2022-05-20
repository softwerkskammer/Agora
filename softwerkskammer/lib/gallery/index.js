const beans = require("simple-configure").get("beans");
const misc = beans.get("misc");
const galleryService = beans.get("galleryService");

const app = misc.expressAppIn(__dirname);

async function sendfile(image, next, res) {
  if (!image) {
    return next();
  }
  res.sendFile(image);
}

app.get("/avatarFor/:nickname", async (req, res, next) => {
  const image = await galleryService.retrieveScaledImageAsync(req.params.nickname);
  sendfile(image, next, res);
});

app.get("/:imageId", async (req, res, next) => {
  const image = await galleryService.retrieveScaledImageAsync(req.params.imageId, req.query.size);
  sendfile(image, next, res);
});

module.exports = app;
