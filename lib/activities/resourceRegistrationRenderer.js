"use strict";

var Resource = require('nconf').get('beans').get('resource');

function RenderingInformation(url, displayText, isSingle) {
  this.url = url;
  this.displayText = displayText;
  this.isSingle = isSingle;
  return this;
}

RenderingInformation.prototype.renderHtml = function () {
  if (!this.url) {
    return this.isSingle ? this.displayText : '<span style="text-align: center;" class="col-xs-6 control-label")>' + this.displayText + '</span>';
  }
  var btnClass = this.url.indexOf('un') === 0 || this.url.indexOf('remove') === 0 ? 'btn-default' : 'btn-primary';
  if (this.isSingle) {
    return '<a href="' + this.url + '" class="btn ' + btnClass + '">' + this.displayText + '</a>';
  }
  return '<a href="' + this.url + '" class="col-xs-6 btn ' + btnClass + '">' + this.displayText + '</a>';
};

module.exports.htmlRepresentationOf = function (activity, resource, memberId) {
  var url = encodeURIComponent(activity.url()) + '/' + encodeURIComponent(resource.resourceName);
  var state = resource.registrationStateFor(memberId);
  if (activity.resourceNames().length === 1) {
    if (state === Resource.registered) {
      return new RenderingInformation('unsubscribe/' + url, 'Ich kann doch nicht…', true);
    }
    if (state === Resource.registrationPossible) {
      return new RenderingInformation('subscribe/' + url, 'Ich bin dabei!', true);
    }
    if (state === Resource.registrationElsewhere) {
      return new RenderingInformation(null, 'Für dieses Event kannst Du Dich nicht bei der Softwerkskammer anmelden.', true);
    }
    if (state === Resource.registrationClosed) {
      return new RenderingInformation(null, 'Anmeldung ist zur Zeit nicht möglich.', true);
    }
    if (state === Resource.waitinglistPossible) {
      return new RenderingInformation('addToWaitinglist/' + url, 'Auf die Warteliste!', true);
    }
    if (state === Resource.onWaitinglist) {
      return new RenderingInformation('removeFromWaitinglist/' + url, 'Warteliste verlassen…', true);
    }
    return new RenderingInformation(null, 'Alle Plätze sind belegt.', true);
  }
  if (state === Resource.registered) {
    return new RenderingInformation('unsubscribe/' + url, 'Absagen');
  }
  if (state === Resource.registrationPossible) {
    return new RenderingInformation('subscribe/' + url, 'Anmelden');
  }
  if (state === Resource.registrationElsewhere) {
    return new RenderingInformation(null, 'Anmeldung ist nicht über die Softwerkskammer möglich.');
  }
  if (state === Resource.registrationClosed) {
    return new RenderingInformation(null, 'Anmeldung ist zur Zeit nicht möglich.');
  }
  if (state === Resource.waitinglistPossible) {
    return new RenderingInformation('addToWaitinglist/' + url, 'Auf die Warteliste!');
  }
  if (state === Resource.onWaitinglist) {
    return new RenderingInformation('removeFromWaitinglist/' + url, 'Warteliste verlassen…');
  }
  return new RenderingInformation(null, 'Alle Plätze sind belegt.', true);
};
