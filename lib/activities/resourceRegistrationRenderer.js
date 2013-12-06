"use strict";

var Resource = require('nconf').get('beans').get('resource');

module.exports = {
  htmlRepresentationOf: function (activity, resource, memberId) {
    var url = encodeURIComponent(activity.url()) + '/' + encodeURIComponent(resource.resourceName);
    var state = resource.registrationStateFor(memberId);
    if (activity.resourceNames().length === 1) {
      if (state === Resource.registered) {
        return '<ahref="unsubscribe/' + url + '" class="btn btn-default">Ich kann doch nicht…</a>';
      }
      if (state === Resource.registrationPossible) {
        return '<a href="subscribe/' + url + '" class="btn btn-primary">Ich bin dabei!</a>';
      }
      if (state === Resource.registrationElsewhere) {
        return 'Für dieses Event kannst Du Dich nicht bei der Softwerkskammer anmelden.';
      }
      if (state === Resource.registrationClosed) {
        return 'Anmeldung ist zur Zeit nicht möglich.';
      }
      if (state === Resource.waitinglistPossible) {
        return '<a href="addToWaitinglist/' + url + '" class="btn btn-primary">Auf die Warteliste!</a>';
      }
      if (state === Resource.onWaitinglist) {
        return '<a href="removeFromWaitinglist/' + url + '" class="btn btn-primary">Warteliste verlassen!</a>';
      }
      return 'Alle Plätze sind belegt.';
    }
    if (state === Resource.registered) {
      return '<a href="unsubscribe/' + url + '" class="col-xs-6 btn btn-default">Absagen</a>';
    }
    if (state === Resource.registrationPossible) {
      return '<a href="subscribe/' + url + '" class="col-xs-6 btn btn-primary">Anmelden</a>';
    }
    if (state === Resource.registrationElsewhere) {
      return '<span style="text-align: center;" class="col-xs-6 control-label")>Anmeldung ist nicht über die Softwerkskammer möglich.</span>';
    }
    if (state === Resource.registrationClosed) {
      return '<span style="text-align: center;" class="col-xs-6 control-label")>Anmeldung ist zur Zeit nicht möglich.</span>';
    }
    if (state === Resource.waitinglistPossible) {
      return '<a href="addToWaitinglist/' + url + '" class="col-xs-6 btn btn-primary"> Auf die Warteliste!</a>';
    }
    if (state === Resource.onWaitinglist) {
      return '<a href="removeFromWaitinglist/' + url + '" class="col-xs-6 btn btn-primary">Warteliste verlassen!</a>';
    }
    return '<span style="text-align: center;" class="col-xs-6 control-label")>Alle Plätze sind belegt.</span>';
  }
};
