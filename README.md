NeuePlattform-Implementierung
=============================

Current Build Status
--------------------

[![Build Status](https://travis-ci.org/softwerkskammer/NeuePlattform-Implementierung.png)](https://travis-ci.org/softwerkskammer/NeuePlattform-Implementierung)


Preparations for use
--------------------

* Check out this project into some folder (let's call it *REPO* from now on)
* In *REPO*, run `npm install`


Running the server
------------------

* In *REPO*, invoke `node start.js`
* You can now access the application by entering [http://localhost:17124](http://localhost:17124) in your browser

Running the tests
-----------------

<<<<<<< HEAD
To run the tests, you need to install Grunt. This can be done e.g. in the `bin` folder in your Home directory or in some other directory `GLOBALPATH/bin`.
=======
To run the tests, you need to install Grunt. We propose to install Grunt globally via the -g option of npm:
>>>>>>> extended the README

* If you want the global npm directory inside your Home directory,create a file called `.npmrc` with the following contents in your Home directory:

        prefix = GLOBALPATH
        umask = 077
        
<<<<<<< HEAD
* Anywhere, invoke `npm install -g grunt-cli`
* If the directory `GLOBALPATH/bin` is not in your path (you can check with `echo $PATH`), you need to add it to the path: In your Home directory, create or edit the file `.profile` and add the following line:
=======
* Anywhere, invoke `npm install -g grunt-cli`. This will install grunt to your global npm repository, typically inside `/usr/local/bin` or - if you chose the option above - to the `bin` folder inside your Home directory.
* If you chose the Home directory install option: In your Home directory, create or edit the file `.profile` and add the following line:
>>>>>>> extended the README

        export PATH=GLOBALPATH/bin/:$PATH

Now, you can run the tests in *REPO* with `npm test`

