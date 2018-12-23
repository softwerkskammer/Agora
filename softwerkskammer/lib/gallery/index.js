const beans = require('simple-configure').get('beans');
const misc = beans.get('misc');
const galleryService = beans.get('galleryService');

const app = misc.expressAppIn(__dirname);

function sendImage(res, next) {
  return (err, imagePath) => {
    if (err || !imagePath) { return next(err); }
    res.sendFile(imagePath);
  };
}

app.get('/avatarFor/:nickname', (req, res, next) => {
  galleryService.retrieveScaledImage(req.params.nickname, undefined, sendImage(res, next));
});

app.get('/:imageId', (req, res, next) => {
  galleryService.retrieveScaledImage(req.params.imageId, req.query.size, sendImage(res, next));
});

module.exports = app;
