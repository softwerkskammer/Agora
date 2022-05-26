/*global __html__ */
(function () {
  "use strict";

  document.body.innerHTML += __html__["softwerkskammer/frontendtests/fixtures/forms.html"];
  document.body.innerHTML +=
    '<span id="first" class="urlify">http://my.first.link</span>' +
    '<span id="second" class="urlify">http://my.first.link, http://my.first.link.again</span>' +
    '<span id="third" class="urlify">http://my.first.link, my.first.link.again</span>' +
    '<span id="fourth" class="twitterify">softwerkskammer</span>' +
    '<span id="sixth" class="interestify">a, b, a b, a;b ,cb</span>';
})();
