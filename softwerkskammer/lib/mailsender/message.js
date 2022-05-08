const R = require("ramda");
const pug = require("pug");
const path = require("path");
const conf = require("simple-configure");
const beans = conf.get("beans");
const publicUrlPrefix = conf.get("publicUrlPrefix");
const misc = beans.get("misc");
const Renderer = beans.get("renderer");

class Message {
  constructor(body, member) {
    this.buttons = [];
    if (body && member) {
      this.setSubject(body.subject);
      this.setMarkdown(body.markdown);
      this.senderName = member.displayName();
      this.senderAddress = member.email();
      this.buttons = body.buttons ? JSON.parse(body.buttons) : [];
      if (body.sendCopyToSelf) {
        this.setTo(member.email());
      }
    }
    return this;
  }

  setTo(toAddresses) {
    this.to = toAddresses;
  }

  setBccToGroupMemberAddresses(groups) {
    this.setBccToMemberAddresses(R.flatten(misc.compact(groups).map((group) => group.members)));
  }

  setBccToMemberAddresses(members) {
    this.bcc = R.uniq(misc.compact(members).map((member) => member.email()));
  }

  setReceiver(member) {
    this.receiver = member; // required for UI (see pug-file)
    this.bcc = member.email();
  }

  setSubject(subject) {
    this.subject = subject;
  }

  setMarkdown(markdown) {
    this.markdown = markdown || "";
  }

  setIcal(ical) {
    this.icalEvent = ical;
    this.markdown =
      (this.markdown || "") +
      "\r\n\r\n\r\n **Wichtig:** Der ical Anhang ist nur für Deinen Kalender. Das Annehmen der ical Einladung hat keine Auswirkungen und wird nicht verarbeitet.";
  }

  addToButtons(buttonOrButtons) {
    this.buttons = this.buttons.concat(misc.toArray(buttonOrButtons));
  }

  removeAllButFirstButton() {
    if (!this.buttons || this.buttons.length === 0) {
      return;
    }
    this.buttons = [this.buttons[0]];
  }

  toTransportObject(senderAddress, includeFooter) {
    const formatEMailAddress = function (name, email) {
      return '"' + name + '" <' + email + ">";
    };

    const modifiedMarkdown = this.markdown.replace(/\]\(\//g, "](" + publicUrlPrefix + "/");

    const renderingOptions = {
      pretty: true,
      content: Renderer.render(modifiedMarkdown),
      plain: modifiedMarkdown,
      buttons: this.buttons,
      includeFooter,
    };
    const filename = path.join(__dirname, "views/mailtemplate.pug");
    const filenameTextonly = path.join(__dirname, "views/mailtemplate-textonly.pug");

    const fromName =
      (this.senderName ? this.senderName + " via " : "") + (conf.get("domainname") || "softwerkskammer.org");
    const replyTo = this.senderName ? formatEMailAddress(this.senderName, this.senderAddress) : undefined;
    return {
      from: formatEMailAddress(fromName, senderAddress),
      replyTo,
      to: this.to,
      cc: this.cc,
      bcc: this.bcc,
      subject: this.subject,
      text: pug.renderFile(filenameTextonly, renderingOptions),
      html: pug.renderFile(filename, renderingOptions),
      icalEvent: this.icalEvent,
    };
  }
}

module.exports = Message;
