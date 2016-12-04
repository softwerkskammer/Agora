'use strict';

module.exports = function handle404() {
  return (req, res) => {
    res.status(404);
    res.render('errorPages/404.pug');
  };
};
