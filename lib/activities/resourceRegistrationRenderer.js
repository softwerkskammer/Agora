"use strict";

var Resource = require('nconf').get('beans').get('resource');

function RenderingInformation(url, displayText) {
  this.url = url;
  this.displayText = displayText;
  return this;
}

RenderingInformation.prototype.representsButton = function () {
  return !!this.url;
};

RenderingInformation.prototype.isWithdrawal = function () {
  return this.representsButton() && (this.url.indexOf('un') === 0 || this.url.indexOf('remove') === 0);
};

module.exports.htmlRepresentationOf = function (activity, resourceName, memberId) {
  var resource = activity.resourceNamed(resourceName);
  var url = encodeURIComponent(activity.url()) + '/' + encodeURIComponent(resourceName);
  var state = resource.registrationStateFor(memberId);
  var isSingle = activity.resourceNames().length === 1;
  if (state === Resource.registered) {
    return new RenderingInformation('unsubscribe/' + url, isSingle ? 'Ich kann doch nicht…' : 'Absagen');
  }
  if (state === Resource.registrationPossible) {
    return new RenderingInformation('subscribe/' + url, isSingle ? 'Ich bin dabei!' : 'Anmelden');
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
