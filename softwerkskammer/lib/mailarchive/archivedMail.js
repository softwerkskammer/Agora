'use strict';

const moment = require('moment-timezone');
const Encoder = require('node-html-encoder').Encoder;
const encoder = new Encoder('entity');
const fieldHelpers = require('simple-configure').get('beans').get('fieldHelpers');

class ArchivedMail {
  constructor(object) {
    this.id = object.id;
    this.group = object.group;
    this.subject = object.subject;
    this.from = object.from;
    this.timeUnix = object.timeUnix || 0;
    this.references = object.references;
    this.text = object.text;
    if (object.html) {
      this.html = object.html;
    } else if (this.text) {
      this.html = '<div>\n' + encoder.htmlEncode(object.text).replace(/&#10;/g, '<br>\n') + '\n</div>';
    }

    this.time = this.timeUnix && moment.unix(this.timeUnix);
    this.responses = [];
  }

  getHtml() {
    return fieldHelpers.killHtmlHead(fieldHelpers.replaceLongNumbers(fieldHelpers.replaceMailAddresses(this.html)));
  }

  memberNickname() {
    return this.member ? this.member.nickname() : null;
  }

  displayedSenderName() {
    return this.member ? this.member.displayName() : (this.from ? this.from.name || '' : '');
  }

  memberId() {
    return this.from ? this.from.id : null;
  }

  sortedResponses() {
    return this.responses.sort(function (a, b) { return a.timeUnix - b.timeUnix; });
  }

  youngestResponse() {
    if (this.responses && this.responses.length > 0) {
      return this.responses.reduce((memo, response) => response.youngestResponse().timeUnix > memo.youngestResponse().timeUnix ? response : memo, this.responses[0]);
    }
    return this;
  }
}

module.exports = ArchivedMail;
