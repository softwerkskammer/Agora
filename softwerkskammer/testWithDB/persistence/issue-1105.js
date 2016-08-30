'use strict';

/**
 * Test for https://github.com/softwerkskammer/Agora/issues/1105
 */

var beans = require('../../testutil/configureForTestWithDB').get('beans');
var persistence = beans.get('membersPersistence');

describe('Persistence', function () {
  describe('listByFieldWithOptions()', function () {
    it('should not throw error if list is empty', function (done) {
      persistence.listByField({'foo': 'bar'}, {}, function (err) {
        done(err);
      });
    });
  });
});

