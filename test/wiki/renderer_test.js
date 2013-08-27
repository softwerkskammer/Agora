"use strict";
var chai = require("chai");
var expect = chai.expect;

var Renderer = require("../../lib/wiki/renderer");

describe("Renderer", function () {

  it("should render bracket tags1", function () {
    var text = "a [[Foo]] b";
    expect(Renderer.render(text, 'subdir')).to.equal("<p>a <a class=\"internal\" href=\"/wiki/subdir/foo\">Foo</a> b</p>\n");
  });

  it("should render bracket tags2", function () {
    var text = "a [[Foo]][[Foo]][[Foo]] b";
    expect(Renderer.render(text, 'subdir')).to.be.equal("<p>a <a class=\"internal\" href=\"/wiki/subdir/foo\">Foo</a><a class=\"internal\" href=\"/wiki/subdir/foo\">Foo</a><a class=\"internal\" href=\"/wiki/subdir/foo\">Foo</a> b</p>\n");
  });

  it("should render bracket tags3", function () {
    var text = "a [[Foo Bar]] b";
    expect(Renderer.render(text, 'subdir')).to.be.equal("<p>a <a class=\"internal\" href=\"/wiki/subdir/foo-bar\">Foo Bar</a> b</p>\n");
  });

  it("should render bracket tags4", function () {
    var text = "a [[Foo]][[Bar]] b";
    expect(Renderer.render(text, 'subdir')).to.be.equal("<p>a <a class=\"internal\" href=\"/wiki/subdir/foo\">Foo</a><a class=\"internal\" href=\"/wiki/subdir/bar\">Bar</a> b</p>\n");
  });

  it("should render bracket tags5", function () {
    var text = "a [[Foo]] [[Bar]] b";
    expect(Renderer.render(text, 'subdir')).to.be.equal("<p>a <a class=\"internal\" href=\"/wiki/subdir/foo\">Foo</a> <a class=\"internal\" href=\"/wiki/subdir/bar\">Bar</a> b</p>\n");
  });

  it("should render bracket tags6", function () {
    var text = "a [[Il marito di Foo|Foobar]] [[Bar]] b";
    expect(Renderer.render(text, 'subdir')).to.be.equal("<p>a <a class=\"internal\" href=\"/wiki/subdir/foobar\">Il marito di Foo</a> <a class=\"internal\" href=\"/wiki/subdir/bar\">Bar</a> b</p>\n");
  });

  it("should render bracket tags7", function () {
    var text = "a [[Foo / Bar]] b";
    expect(Renderer.render(text, 'subdir')).to.be.equal("<p>a <a class=\"internal\" href=\"/wiki/subdir/foo---bar\">Foo / Bar</a> b</p>\n");
  });

});
