# System requirements and Installation

## Node.js

It is a node.js project. Therefore, you need node.js installed. Get it from [http://nodejs.org](http://nodejs.org).

You need a version compatible with the one defined in package.json to run the software.

## Git

- Git must be in the system path.

## Preparations for use

- Check out this project into some folder (let's call it _REPO_ from now on)
- Open a shell as described above and go to _REPO_
- Run `yarn install --immutable`

### The built-in wiki

To set up the built-in wiki follow [these instructions for Softwerkskammer](softwerkskammer/lib/wiki/README.md)

### Configuring the server

Configuration for Softwerkskammer:

- Copy the logging configuration file `config-examples/winston-config.json` to `config/winston-config.json`, and adapt the paths if you like.
- Copy the mailsender configuration file `config-examples/mailsender-config.json` to `config/mailsender-config.json`. Without setting up a proper server sending mails won't work but this configuration is sufficient to be able to start the softwerkskammer app.
- Copy the authentication configuration file `config-examples/authentication-config.json` to `config/authentication-config.json`.

#### Mailserver settings

if you want to be able to send mails, you need to configure the mail sender. One way to achieve a running configuration
is to use a mail server you have access to. The configuration should look like this:

###### config/mailsender-config.json

<pre><code>
{
 "transport-options": {
   "host": "server host name e.g. smtp.yourdomain.com",
   "port": the port you use to connect to the server to send mails e.g. 25 or 465,
   "secure": false,
   "auth": {
     "user": "the user to log in to your mail server",
     "pass": "the password"
   },
   "debug": "true",
   "tls": {
     "rejectUnauthorized": false
   }
 },
 "sender-name": "Softwerkskammer Benachrichtigungen",
 "sender-address": "mail address to send from"
}
</code></pre>

### Running the server - Database Initialization

- Open a shell in _REPO_
- If your installation is fresh, run the db initialization script:
  - In any case, run `node softwerkskammer/initialDBSetup`
- If your installation is fresh or you changed anything:
  - Run `yarn deploy` (this creates the CSS files and other static contents and performs eslint checking)

Now you can start Softwerkskammer:

- `yarn start` - will start the server
- Now go to your local machine, open a browser and use `http://localhost:17124`
- The port `17124` is the default and can be changed via the command line option `--port` or via the environment option 'port' to any desired value
- **Login:** The testdata includes a superuser with email: `test@user.de` password: `testuser`
- If your installation is fresh, you should create an account for yourself by registering.
  - The default setup assumes you are running on localhost for authentication. If you are using a different hostname, you have to edit the configuration file `config-examples/server-config.json`. Follow the instructions in there.

### Full Access to the Applications

Not all features can be accessed without login. Some can only be accessed when you are superuser.

Access for Softwerkskammer:

- Log in to the application. Be aware that GitHub cannot be used out of the box. Therefore, you should use an OpenID provider such as Stack Exchange, XLogon (https://my.xlogon.net/)
  or you can choose one from this list: http://openid.net/get-an-openid/

- To access certain admin features, you may want to become superuser.
  This step will make you superuser of both applications at once.
  In order to do this, start a query on your database file for `memberstore` and search for _your_ entry.
  Select the `id`, create a copy of `config-examples/authentication-config.json` and add your id to the `superuser` array.
