const conf = require('simple-configure');
const beans = conf.get('beans');
const Group = beans.get('group');

module.exports = {
  bodyToGroup: function (body) {
    const override = {
      contactTheOrganizers: body.contactTheOrganizers ? body.contactTheOrganizers === 'on' : false
    };
    const mapped = Object.assign({}, body, override);
    return new Group(mapped);
  }
};
