'use strict';

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
    return new RenderingInformation('unsubscribe/' + url, isSingle ? 'activities.unsubscribe_single' : 'activities.unsubscribe_multiple');
  }
  if (state === Resource.registrationPossible) {
    return new RenderingInformation('subscribe/' + url, isSingle ? 'activities.subscribe_single' : 'activities.subscribe_multiple');
  }
  if (state === Resource.registrationElsewhere) {
    return new RenderingInformation(null, 'activities.registration_not_here');
  }
  if (state === Resource.registrationClosed) {
    return new RenderingInformation(null, 'activities.registration_not_now');
  }
  if (state === Resource.waitinglistPossible) {
    return new RenderingInformation('addToWaitinglist/' + url, 'activities.add_to_waitinglist');
  }
  if (state === Resource.onWaitinglist) {
    return new RenderingInformation('removeFromWaitinglist/' + url, 'activities.remove_from_waitinglist');
  }
  if (state === Resource.fixed) {
    return new RenderingInformation(null, 'activities.unsubscribe_not_possible');
  }
  return new RenderingInformation(null, 'activities.full', true);
};
