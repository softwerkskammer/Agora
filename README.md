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

To run the tests, you need to install Grunt:

* In your Home directory, create a file called `.npmrc` with the following contents:

        prefix = path-to-your-home-directory
        umask = 077
        
* Anywhere, invoke `npm install -g grunt-cli`
* In your Home directory, create or edit the file `.profile` and add the following line:

        export PATH=path-to-your-home-directory/bin/:$PATH

Now, you can run the tests in *REPO* with `npm test`

