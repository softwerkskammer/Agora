const crypto = require('crypto');

function genSalt() {
  const length = 64;
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex') // convert to hexadecimal format
    .slice(0, length); // return required number of characters
}

function hashPassword(password, salt) {
  /*eslint no-sync: 0 */
  return crypto.pbkdf2Sync(password, salt, 100000, 512, 'sha512').toString('hex');
}

module.exports = {
  genSalt,
  hashPassword
};
