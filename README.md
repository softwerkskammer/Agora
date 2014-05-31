Agora
=====

This project comprises a web platform for a Community Server.

There is a companion project where the feature backlog lives. Go to the issues in [https://github.com/softwerkskammer/Agora-Backlog/issues](https://github.com/softwerkskammer/Agora-Backlog/issues)

---

Video hangout
--------------------

Co-ordination via the mailinglist at [http://www.softwerkskammer.org/groups/neueplattform](http://www.softwerkskammer.org/groups/neueplattform)

What this is about
==================
This is the project to build the new groupware platform for the German Software Craftsmanship Communities. It can be seen in action on [http://softwerkskammer.org](http://softwerkskammer.org)
The site is currently German only.

---

Current Build Status
--------------------

[![Build Status](https://travis-ci.org/softwerkskammer/Agora.png)](https://travis-ci.org/softwerkskammer/Agora)


New and easy local installation via vagrant
===========================================
Vagrant is an easy way to set up virtual machines inside your OS with everything needed to get our server up and running.

Just follow these steps:

1. Download and install Oracle VirtualBox from here: https://www.virtualbox.org
1. Download and install Vagrant from here: http://www.vagrantup.com
1. Check your version of Vagrant with `vagrant --version`. 1.5.1 and above are known to work.
1. Clone, or if you plan to make contributions, fork and clone the repo (forking is a must if you want to contribute)
1. Open a shell inside the checkout directory
1. Perform `vagrant up` - (this will download and provision the virtual machine)
1. You can then log into the VM via `vagrant ssh`
1. You will find the sources inside the VM in a directory `/vagrant`
1. So `cd /vagrant`

Once retrieved perform the following commands inside the directory of the cloned repo:

1. `npm install` - this will fetch all dependencies needed
1. `node initialDBSetup` - this will create some sample data to start with
1. `npm test` - will create a few necessary files and perform a complete test suite. *This must end successfully!*
1. `node start` - will start the server

Now go to you local machine, open a browser and open `http://localhost:17124`

System requirements and Installation
--------------------

### Node.js

It is a node.js project. Therefore you need node.js installed. Get it from [http://nodejs.org](http://nodejs.org).

You need a current 0.10.x version to run the software.

Your node.js installation must contain at least npm 1.3.

### Additional Software

Some modules are compiled during the installation. Therefore some additional software must be installed.

#### Python

* Python 2.7 (not Python 3!) in system path
* For Windows:
  * Make sure that Python and node.js are both either 32 bit or 64 bit - mixed combinations will not work!
  * Add an environment variable `PYTHON` that points to the Python executable.

#### C++

* Install a C++ compiler with headers and libraries (depending on your OS)
  * For Mac OS X: Install XCode from the App Store. In XCode's preferences (section "Downloads"), install the command line tools. When you have installed
    the stand alone version of the command line tools, you need to execute `sudo xcode-select -switch /usr/bin` before you are able to run `npm install`.
  * For Windows 7 and older: Microsoft Windows SDK for Windows 7 and .NET Framework 4 [available here](http://www.microsoft.com/en-us/download/details.aspx?id=8279)
  * For Windows 8 (may also work for Windows 7):
     * Microsoft Visual Studio C++ 2012 for Windows Desktop ([Express](http://go.microsoft.com/?linkid=9816758) version works well)

#### Git

* Git must be in the system path

#### MongoDB

* Install MongoDB (Version 2.4) [http://www.mongodb.org/downloads](http://www.mongodb.org/downloads)

#### Grunt-CLI

We propose to install grunt-cli globally via the -g option of npm. To find out more about this option, see [https://npmjs.org/doc/global.html](https://npmjs.org/doc/global.html).:

* (Optional) To define the installation location of global npm packages on Unix-like Systems create a file called `.npmrc` with the following contents in your Home directory:

        prefix = GLOBALPATH
        umask = 077

* Anywhere, invoke `npm install -g grunt-cli` or `sudo npm install -g grunt-cli` if you don't have sufficient user privileges. You can check the installation with `which grunt`. If a location is returned everything is fine.
* (Optional) If the directory `GLOBALPATH/bin` is not in your path (you can check with `echo $PATH`), you need to add it to the path: In your Home directory, create or edit the file `.profile` and add the following line:

        export PATH=GLOBALPATH/bin/:$PATH

#### Shell for `npm install`

* You need a shell (a.k.a. command line window) that is able to access the stuff you just installed.

* For Windows 7 and older:
   * The shell must be set up for running the Microsoft C++ compiler, like so:

            cmd.exe /E:ON /V:ON /T:0E /K "C:\Program Files\Microsoft SDKs\Windows\v7.1\Bin\SetEnv.cmd" /Release /X86

* For Windows 7 or 8:
   * Use the [Visual Studio Developer Command Prompt](http://msdn.microsoft.com/en-us/library/ms229859.aspx)

Preparations for use
--------------------

* Check out this project into some folder (let's call it *REPO* from now on)
* Open a shell as described above and go to *REPO*
* Run `npm install`

* If python 3 is the default version, the command line for `npm install` must be adapted to the right python version (2.7)

            npm install --python /usr/bin/python2

* Start mongodb. If you only plan to use it for development, the default settings are ok. The app as well as the tests use these defaults if you did not change the configuration.
* (Optional) Instructions for authenticated use are [here](lib/persistence/README.md)

The built-in wiki
-----------------

To set up the built-in wiki follow [these instructions](lib/wiki/README.md)

Running the server
------------------

* Open a shell in *REPO*
* If your installation is fresh, perform the db initialization script:
   * Run `node initialDBSetup`
* If your installation is fresh or you changed anything:
   * Run `npm test` (this creates the CSS files and other static contents and performs jshint checking)

* Run `npm start`

* You can now access the application by entering [http://localhost:17124](http://localhost:17124) in your browser
  * The port `17124` is the default and can be changed via the command line option `--port` or via the environment option 'port' to any desired value
* If your installation is fresh, you should create an account for yourself by registering.
  * The default setup assumes you are running on localhost for authentication. If you are using a different hostname, you have to edit the configuration file `config/example-server-config.json`. Follow the instructions in there.

Running the tests
-----------------

You can run the tests in *REPO* with `npm test`

####Optional
For running specific tests only, you can use mocha in a command like
`mocha -R spec test/announcements/` To install mocha, invoke `npm install -g mocha` or `sudo npm install -g mocha` 

To run the style check (jshint) and the tests on every file change, use `grunt watch`

Debugging the tests in the IDE [Webstorm](http://www.jetbrains.com/webstorm/)
----------

Follow these [instructions](http://codebetter.com/glennblock/2013/01/17/debugging-mocha-unit-tests-with-webstorm-step-by-step/)

Editing the stylesheets
-----------------------

Only edit the agora.less file inside the "partials" subfolder. Running `npm test` or `grunt default` will compile everything to screen.css.
