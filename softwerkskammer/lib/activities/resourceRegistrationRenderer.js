const Resource = require("simple-configure").get("beans").get("resource");

class RenderingInformation {
  constructor(type, url, displayText) {
    this.type = type;
    this.url = url;
    this.displayText = displayText;
  }

  representsButton() {
    return !!this.url;
  }

  isWithdrawal() {
    return this.representsButton() && (this.type.indexOf("un") === 0 || this.type.indexOf("remove") === 0);
  }
}

module.exports.htmlRepresentationOf = function (activity, memberId) {
  const resource = activity.resourceNamed();
  const state = resource.registrationStateFor(memberId);
  if (state === Resource.registered) {
    return new RenderingInformation("unsubscribe", activity.url(), "activities.unsubscribe_single");
  }
  if (state === Resource.registrationPossible) {
    return new RenderingInformation("subscribe", activity.url(), "activities.subscribe_single");
  }
  if (state === Resource.canSubscribeFromWaitinglist) {
    return new RenderingInformation("subscribe", activity.url(), "activities.subscribe_single");
  }
  if (state === Resource.registrationElsewhere) {
    return new RenderingInformation(null, null, "activities.registration_not_here");
  }
  if (state === Resource.registrationClosed) {
    return new RenderingInformation(null, null, "activities.registration_not_now");
  }
  if (state === Resource.waitinglistPossible) {
    return new RenderingInformation("addToWaitinglist", activity.url(), "activities.add_to_waitinglist");
  }
  if (state === Resource.onWaitinglist) {
    return new RenderingInformation("removeFromWaitinglist", activity.url(), "activities.remove_from_waitinglist");
  }
  if (state === Resource.fixed) {
    return new RenderingInformation(null, null, "activities.unsubscribe_not_possible");
  }
  return new RenderingInformation(null, null, "activities.full", true);
};
