Agora
=====
There is a companion project where the feature backlog lives. Go to the issues in [https://github.com/softwerkskammer/Agora-Backlog/issues](https://github.com/softwerkskammer/Agora-Backlog/issues)

---

Weekly video hangout
--------------------

Every Friday at 21:00 Berlin Time: [https://plus.google.com/hangouts/_/ba8817214c2fdc3971b6851b930a8651f466fd8d](https://plus.google.com/hangouts/_/ba8817214c2fdc3971b6851b930a8651f466fd8d)

What this is about
==================
This is the project to build the new groupware platform for the German Software Craftsmanship Communities. It can be seen in action on http://softwerkskammer.org
The site is currently German only.

---

Current Build Status
--------------------

[![Build Status](https://travis-ci.org/softwerkskammer/Agora.png)](https://travis-ci.org/softwerkskammer/Agora)

System requirements for installation
--------------------
It is a node.js project. Therefore you need node.js installed. We are currently using version 0.8 (you should use at least 0.8.19) and npm 1.2.

Get it from [http://nodejs.org](http://nodejs.org)

Some modules are compiled during the installation. Therefore some software should be installed.

* Python 2.7 in system path
* Git in system path
* OS depending C++ compiler with headers and libraries
  * For Windows: Microsoft Windows SDK for Windows 7 and .NET Framework 4 [available here](http://www.microsoft.com/en-us/download/details.aspx?id=8279)
  * For Mac OS X: Install XCode from the App Store. In XCode's preferences (section "Downloads"), install the command line tools. When you have installed
    the stand alone version of the command line tools, you need to execute `sudo xcode-select -switch /usr/bin` before you are able to run `npm install`.
* MongoDB (Version 2.4) [http://www.mongodb.org/downloads](http://www.mongodb.org/downloads)

Preparations for use
--------------------

* Check out this project into some folder (let's call it *REPO* from now on)
* In *REPO*, run `npm install`
  * Under Windows this command must run from a shell set up for running Windows Microsoft Windows SDK compilers

            cmd.exe /E:ON /V:ON /T:0E /K "C:\Program Files\Microsoft SDKs\Windows\v7.1\Bin\SetEnv.cmd" /Release /X86

  * Alternatively run `npm install` in the [Windows SDK Command Promt](http://msdn.microsoft.com/en-us/library/ms229859.aspx)
  * If python 3 is the default version, the command line for `npm install` must be adopted with the right python version (2.7)

            npm install --python /usr/bin/python2

* Install mongodb for you operating system from [http://www.mongodb.org/downloads](http://www.mongodb.org/downloads)
* Start mongodb. If you only plan to use it for development, the default settings are ok. The app as well as the tests use these defaults if nothing different is configured.
* (Optional) Instructions for authenticated use are [here](lib/persistence/README.md)

The built-in wiki
-----------------

To set up the built in wiki follow [these instructions](lib/wiki/README.md) 

Running the server
------------------

* In *REPO*, invoke `npm start`
* You can now access the application by entering [http://localhost:17124](http://localhost:17124) in your browser
  * The port `17124` is the default and can be changed via the command line option `--port` or via the environment option 'port' to any wanted value
* The shell script start.sh can be used to set configuration parameters via environment variables
  * The options set in this script (namely `swkTrustedAppName`, `swkTrustedAppPwd` and `swkRemoteAppUser`) can and should be set via the command line option and/or environment variables as well

Running the tests
-----------------

To run the tests, you need to install grunt-cli. We propose to install grunt-cli globally via the -g option of npm. To find out more about this option, see [https://npmjs.org/doc/global.html](https://npmjs.org/doc/global.html).:

* (Optional) To define the installation location of global npm packages on Unix-like Systems create a file called `.npmrc` with the following contents in your Home directory:

        prefix = GLOBALPATH
        umask = 077

* Anywhere, invoke `npm install -g grunt-cli` or `sudo npm install -g grunt-cli` if you don't have sufficient user privileges. You can check the installation with `which grunt`. If a location is returned everything is fine.
* (Optional) If the directory `GLOBALPATH/bin` is not in your path (you can check with `echo $PATH`), you need to add it to the path: In your Home directory, create or edit the file `.profile` and add the following line:

        export PATH=GLOBALPATH/bin/:$PATH

Now, you can run the tests in *REPO* with `npm test`

For running specific tests only, you can use a command like
`mocha -R spec test/announcements/`

To run the style check (jshint) and the tests on every file change, use `grunt watch`

Debugging the tests from IDE [Webstorm](http://www.jetbrains.com/webstorm/)
----------
Follow this [instructions](http://codebetter.com/glennblock/2013/01/17/debugging-mocha-unit-tests-with-webstorm-step-by-step/)

Editing the stylesheets
-----------------------

We are working with [compass](http://compass-style.org/). Requires ruby (see website for version and [installation](http://compass-style.org/install/))). Once installed check installation by invoking 
		compass clean
		compass compile
If these run without problems, check the produced file screen.css inside the stylesheets directory.

Only edit the scss-files inside the "partials" subfolder
