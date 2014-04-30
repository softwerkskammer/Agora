(function () {
  "use strict";

  document.body.innerHTML += '<span id="first" class="urlify">http://my.first.link</span>' +
    '<span id="second" class="urlify">http://my.first.link, http://my.first.link.again</span>' +
    '<span id="third" class="urlify">http://my.first.link, my.first.link.again</span>' +
    '<span id="fourth" class="twitterify">softwerkskammer</span>' +
    '<span id="fifth" class="mailtoify">softwerks@kammer.de</span>';

}());
