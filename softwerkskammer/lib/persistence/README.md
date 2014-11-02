Setting up mongodb for authentication
=====================================

- Check the docs at: [http://docs.mongodb.org/manual/tutorial/control-access-to-mongodb-with-authentication/](http://docs.mongodb.org/manual/tutorial/control-access-to-mongodb-with-authentication/)
- Short version here:
  1. Start `mongod` (without -auth)
  1. Start mongo from the cmd-line as

            mongo admin
  1. Then create the admin user with

            db.addUser("<admin-username>", "<admin-password>")
  1. Then switch the database to `swk`, which is the database for the app (needs to be changed if you altered the name)

            use swk
            db.addUser("<app-username>", "<app-password>")
			exit
  1. Shutdown `mongod` from the `mongo` console

			use admin
			db.shutdownServer()
  1. Start `mongod -auth`
  1. Edit `start.sh`, replace the values of `MONGO_USER` and `MONGO_PASS` with `<app-username>` and `<app-password>`

Remember that once authentication is enabled, the db can only be shutdown via:

			use admin
			db.auth("<admin-username>", "<admin-password>")
			db.shutdownServer()

Some hints on database handling with mongo:

  * Several statements for easy useage in the mongo command line client
    * `show dbs` - show all availabe databases
    * `use swk` - use swk database
    * `show collections` - show all available collections
    * `db.memberstore.find()` - show all entries in the collection 'memberstore'
    * `db.dropDatabase()` - drop currently connected database
