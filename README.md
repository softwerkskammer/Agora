Agora
=====

[![Build Status](https://travis-ci.org/softwerkskammer/Agora.png)](https://travis-ci.org/softwerkskammer/Agora)

This is the project to build the new groupware platform for the German Software Craftsmanship Communities. It can be seen in action on [http://softwerkskammer.org](http://softwerkskammer.org)
The site is currently German only.

Want to help out? Check out our [Contribution guidelines](/CONTRIBUTING.md).

Installation
------------

Please refer to our [installation guidelines](/INSTALL.md) to find out
how to get Agora running on you local development machine.

Tests
-----

Run the tests with `npm test`.

For running specific tests only, use either of these:
- `./node_modules/.bin/grunt karma:once`
- `./node_modules/.bin/grunt mocha_istanbul:test`
- `./node_modules/.bin/grunt mocha_istanbul:testApp`
- `./node_modules/.bin/grunt mocha_istanbul:testWithDB`

To run the style check (eslint) and the tests on every file change, use `grunt watch`.

We are using WebStorm as IDE [Webstorm](http://www.jetbrains.com/webstorm/)
---------------------------------------------------------------------------

![WebStorm Logo](/dev-goodies/webstorm.svg.png)

Feel free to ask us for a community licence if you are contributing.
