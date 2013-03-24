NeuePlattform-Implementierung
=============================

Current Build Status
--------------------

[![Build Status](https://travis-ci.org/softwerkskammer/NeuePlattform-Implementierung.png)](https://travis-ci.org/softwerkskammer/NeuePlattform-Implementierung)

System requirements for installation
--------------------
Some modules are compiled during the installation. Therefore some software should be installed.

* Python 2.7 in system path
* OS depending C++ compiler with headers and libraries
  * For Windows: Microsoft Windows SDK for Windows 7 and .NET Framework 4 [available here](http://www.microsoft.com/en-us/download/details.aspx?id=8279)
  * For Mac OS X: Install XCode from the App Store. In XCode's preferences (section "Downloads"), install the command line tools.

Preparations for use
--------------------

* Check out this project into some folder (let's call it *REPO* from now on)
* In *REPO*, run `npm install`
	* Under Windows this command must run from a shell set up for running Windows Microsoft Windows SDK compilers

            cmd.exe /E:ON /V:ON /T:0E /K "C:\Program Files\Microsoft SDKs\Windows\v7.1\Bin\SetEnv.cmd" /Release /X86 

Running the server
------------------

* In *REPO*, invoke `node start.js`
* You can now access the application by entering [http://localhost:17124](http://localhost:17124) in your browser

Running the tests
-----------------

To run the tests, you need to install Grunt. We propose to install Grunt globally via the -g option of npm. To find out more about this option, see [https://npmjs.org/doc/global.html](https://npmjs.org/doc/global.html).:

* (Optional) To define the installation location of global npm packages on Unix-like Systems create a file called `.npmrc` with the following contents in your Home directory:

        prefix = GLOBALPATH
        umask = 077
        
* Anywhere, invoke `npm install -g grunt-cli` or `sudo npm install -g grunt-cli` if you don't have sufficient user privileges. You can check the installation with `which grunt`. If a location is returned everything is fine.
* (Optional) If the directory `GLOBALPATH/bin` is not in your path (you can check with `echo $PATH`), you need to add it to the path: In your Home directory, create or edit the file `.profile` and add the following line:

        export PATH=GLOBALPATH/bin/:$PATH

Now, you can run the tests in *REPO* with `npm test`

Debugging the tests from IDE [Webstorm](http://www.jetbrains.com/webstorm/)
----------
Follow this [instructions](http://codebetter.com/glennblock/2013/01/17/debugging-mocha-unit-tests-with-webstorm-step-by-step/)


