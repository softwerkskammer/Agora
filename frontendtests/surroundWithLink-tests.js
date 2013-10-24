/* global $, test, equal, surroundWithLink, surroundTwitterName, surroundEmail */
"use strict";

test("A text starting with 'http' is surrounded with a link consisting of the text", 1, function () {
  var text = "http://my.link";
  var result = surroundWithLink(text);
  equal(result, "<a href=\"http://my.link\" target=\"_blank\"><i class=\"fa fa-external-link\"/> http://my.link</a>");
});

test("A text with two URLs starting with 'http' and separated with comma both with a link", 1, function () {
  var text = "http://my.link, http://your.link";
  var result = surroundWithLink(text);
  equal(result, "<a href=\"http://my.link\" target=\"_blank\"><i class=\"fa fa-external-link\"/> http://my.link</a>, <a href=\"http://your.link\" target=\"_blank\"><i class=\"fa fa-external-link\"/> http://your.link</a>");
});

test("A text with one URLs and one normal text separated with commas only one link", 1, function () {
  var text = "http://my.link, your.link";
  var result = surroundWithLink(text);
  equal(result, "<a href=\"http://my.link\" target=\"_blank\"><i class=\"fa fa-external-link\"/> http://my.link</a>, your.link");
});

test("A twittername is modified to link to twitter and prepend an '@", 1, function () {
  var text = "softwerkskammer";
  var result = surroundTwitterName(text);
  equal(result, "<a href=\"http://twitter.com/softwerkskammer\" target=\"_blank\">@softwerkskammer</a>");
});

test("An emailaddress is modified to a mailto-link", 1, function () {
  var text = "softwerks@kammer";
  var result = surroundEmail(text);
  equal(result, "<a href=\"mailto:softwerks@kammer\">softwerks@kammer</a>");
});

test("One link inside class 'urlify' is linked", 1, function () {
  var first = $("#first");
  equal(first.html(), "<a href=\"http://my.first.link\" target=\"_blank\"><i class=\"fa fa-external-link\"></i> http://my.first.link</a>");
});

test("Two links inside class 'urlify' are linked", 1, function () {
  var second = $("#second");
  equal(second.html(), "<a href=\"http://my.first.link\" target=\"_blank\"><i class=\"fa fa-external-link\"></i> http://my.first.link</a>, <a href=\"http://my.first.link.again\" target=\"_blank\"><i class=\"fa fa-external-link\"></i> http://my.first.link.again</a>");
});

test("One link and one non-link inside class 'urlify' are linked accordingly", 1, function () {
  var third = $("#third");
  equal(third.html(), "<a href=\"http://my.first.link\" target=\"_blank\"><i class=\"fa fa-external-link\"></i> http://my.first.link</a>, my.first.link.again");
});

test("One text in class 'twitterify' is linked to twitter", 1, function () {
  var fourth = $("#fourth");
  equal(fourth.html(), "<a href=\"http://twitter.com/softwerkskammer\" target=\"_blank\">@softwerkskammer</a>");
});

test("One text in class 'mailtoify' is linked to mailto", 1, function () {
  var fifth = $("#fifth");
  equal(fifth.html(), "<a href=\"mailto:softwerks@kammer.de\">softwerks@kammer.de</a>");
});
