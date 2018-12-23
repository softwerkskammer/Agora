module.exports = function addCsrfTokenToLocals(req, res, next) {
  /* eslint camelcase: 0 */
  res.locals.csrf_token = req.csrfToken();
  next();
};
