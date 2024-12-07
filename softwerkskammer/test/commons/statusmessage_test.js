"use strict";

const statusmessage = require("../../lib/commons/statusmessage");
const expect = require("must-dist");
const i18n = require("i18next");
require("../../testutil/configureForTest");
require("../../lib/middleware/initI18N");

describe("Statusmessage", () => {
  it('has type "danger" when created as error', () => {
    const session = {};
    statusmessage.errorMessage("", "").putIntoSession({ session });
    expect(session.statusmessage.type).to.equal("alert-danger");
  });

  it('has type "success" when created as success', () => {
    const session = {};
    statusmessage.successMessage("", "").putIntoSession({ session });
    expect(session.statusmessage.type).to.equal("alert-success");
  });

  it("is in res when recreated from object", () => {
    const locals = {};
    statusmessage.fromObject({ type: "alert-success" }).putIntoSession({ session: {} }, { locals });
    expect(locals.statusmessage.contents().type).to.equal("alert-success");
  });

  describe("translation", () => {
    it("", () => {
      expect(i18n.t("mailsender.notification")).to.equal("Nachricht");

      const nestedTranslated = i18n.t("message.content.mailsender.success", { type: "$t(mailsender.notification)" });
      expect(nestedTranslated).to.equal("Deine Nachricht ist unterwegs.");
    });
  });
});
