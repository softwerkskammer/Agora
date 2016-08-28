Agora
=====

[![Build Status](https://travis-ci.org/softwerkskammer/Agora.png)](https://travis-ci.org/softwerkskammer/Agora)

This project comprises a web platform for a Community Server.

There is a companion project where the feature backlog lives. Go to the issues in [https://github.com/softwerkskammer/Agora-Backlog/issues](https://github.com/softwerkskammer/Agora-Backlog/issues)

---

Video hangout
--------------------

Co-ordination via the mailinglist at [http://www.softwerkskammer.org/groups/agora](http://www.softwerkskammer.org/groups/agora)

What this is about
==================
This is the project to build the new groupware platform for the German Software Craftsmanship Communities. It can be seen in action on [http://softwerkskammer.org](http://softwerkskammer.org)
The site is currently German only.

---

Tests
=====

After can run the tests with `npm test` (after you have [set up your local installation](/INSTALL.md)).

For running specific tests only, you can use mocha in a command like
`mocha -R spec test/announcements/` To install mocha, invoke `npm install -g mocha` or `sudo npm install -g mocha` 

To run the style check (jshint) and the tests on every file change, use `grunt watch`

---

We are using WebStorm as IDE [Webstorm](http://www.jetbrains.com/webstorm/)
----------
![WebStorm Logo](http://www.jetbrains.com/webstorm/documentation/docs/logo_webstorm.png)

Feel free to ask us for a community licence if you are contributing.

Editing the stylesheets
-----------------------

Only edit the agora.less file inside the "partials" subfolder. Running `npm test` or `grunt default` will compile everything to screen.css.
