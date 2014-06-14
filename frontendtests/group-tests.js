/*global groups_validator, groupnameAlreadyTaken, prefixAlreadyTaken, contentsOfAlphanumeric, contentsOfPrefixForEMail*/
(function () {
  'use strict';

  describe('Group Form', function () {
    var id = $('#groupform [name=id]');
    var emailPrefix = $('#groupform [name=emailPrefix]');

    var checkFieldMandatory = function (fieldname, value) {
      var field = $(fieldname);
      field.val('');
      expect(groups_validator.element(field)).toBe(false);
      expect(groups_validator.errorList[0].message).toBe('Dieses Feld ist ein Pflichtfeld.');
      field.val(value || 'a');
      expect(groups_validator.element(field)).toBe(true);
    };

    beforeEach(function (done) {
      $(function () {
        id.val('');
        id.trigger('change');
        emailPrefix.val('');
        emailPrefix.trigger('change');
        jasmine.Ajax.install();
        done();
      });
    });

    afterEach(function () {
      jasmine.Ajax.uninstall();
    });

    it('checks that a groupname check response is handled for "true"', function () {
      jasmine.Ajax.stubRequest('/groups/checkgroupname?id=group1').andReturn({responseText: 'true'});
      id.val('group1');
      // trigger validation
      id.trigger('change');

      expect(groups_validator.element(id)).toBe(true);
      expect(groups_validator.errorList).toEqual([]);
    });

    it('checks that a groupname check response is handled for "false"', function () {
      jasmine.Ajax.stubRequest('/groups/checkgroupname?id=group2').andReturn({responseText: 'false'});
      id.val('group2');
      // trigger validation
      id.trigger('change');

      expect(groups_validator.element(id)).toBe(false);
      expect(groups_validator.errorList).toContain(jasmine.objectContaining({message: groupnameAlreadyTaken}));
    });

    it('checks that a prefix check response is handled for "true"', function () {
      jasmine.Ajax.stubRequest('/groups/checkemailprefix?emailPrefix=prefix1').andReturn({responseText: 'true'});
      emailPrefix.val('prefix1');
      // trigger validation
      emailPrefix.trigger('change');

      expect(groups_validator.element(emailPrefix)).toBe(true);
      expect(groups_validator.errorList).toEqual([]);
    });

    it('checks that a prefix check response is handled for "false"', function () {
      jasmine.Ajax.stubRequest('/groups/checkemailprefix?emailPrefix=prefix2').andReturn({responseText: 'false'});
      emailPrefix.val('prefix2');
      // trigger validation
      emailPrefix.trigger('change');

      expect(groups_validator.element(emailPrefix)).toBe(false);
      expect(groups_validator.errorList).toContain(jasmine.objectContaining({message: prefixAlreadyTaken}));
    });

    it('checks that "id" is mandatory', function () {
      checkFieldMandatory('#groupform [name=id]', 'aa');
    });

    it('checks that "id" shorter than 2 letters is invalid', function () {
      id.val('A');
      expect(groups_validator.element(id)).toBe(false);
    });

    it('checks that "id" longer than 20 letters is invalid', function () {
      id.val('MuchTooMuchText123456');
      expect(groups_validator.element(id)).toBe(false);
    });

    it('checks that "id" checks for forbidden characters', function () {
      id.val('1234%');
      expect(groups_validator.element(id)).toBe(false);
      expect(groups_validator.errorList).toContain(jasmine.objectContaining({message: contentsOfAlphanumeric}));
      id.val('äöü');
      expect(groups_validator.element(id)).toBe(false);
      expect(groups_validator.errorList).toContain(jasmine.objectContaining({message: contentsOfAlphanumeric}));
      id.val('12 34');
      expect(groups_validator.element(id)).toBe(false);
      expect(groups_validator.errorList).toContain(jasmine.objectContaining({message: contentsOfAlphanumeric}));
    });

    it('checks that "id" checks for forbidden characters', function () {
      id.val('123ab_-');
      expect(groups_validator.element(id)).toBe(true);
    });

    it('checks that "emailPrefix" is mandatory', function () {
      checkFieldMandatory('#groupform [name=emailPrefix]', '12345');
    });

    it('checks that a "emailPrefix" shorter than 5 letters is invalid', function () {
      emailPrefix.val('Much');
      expect(groups_validator.element(emailPrefix)).toBe(false);
    });

    it('checks that a "emailPrefix" longer than 15 letters is invalid', function () {
      emailPrefix.val('MuchTooMuchText1');
      expect(groups_validator.element(emailPrefix)).toBe(false);
    });

    it('checks that "emailPrefix" checks for forbidden characters', function () {
      emailPrefix.val('1234%');
      expect(groups_validator.element(emailPrefix)).toBe(false);
      expect(groups_validator.errorList).toContain(jasmine.objectContaining({message: contentsOfPrefixForEMail}));
      emailPrefix.val('äöüÄÖÜ');
      expect(groups_validator.element(emailPrefix)).toBe(false);
      expect(groups_validator.errorList).toContain(jasmine.objectContaining({message: contentsOfPrefixForEMail}));
      emailPrefix.val('12_34');
      expect(groups_validator.element(emailPrefix)).toBe(false);
      expect(groups_validator.errorList).toContain(jasmine.objectContaining({message: contentsOfPrefixForEMail}));
    });

    it('checks that "emailPrefix" checks for forbidden characters', function () {
      emailPrefix.val('123ab -');
      expect(groups_validator.element(emailPrefix)).toBe(true);
    });

    it('checks that "longName" is mandatory', function () {
      checkFieldMandatory('#groupform [name=longName]');
    });

    it('checks that "description" is mandatory', function () {
      checkFieldMandatory('#groupform [name=description]');
    });

    it('checks that "type" is mandatory', function () {
      checkFieldMandatory('#groupform [name=type]', 'Themengruppe');
    });

  });
}());

