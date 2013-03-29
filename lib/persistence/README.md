Setting up mongodb for authentication
=====================================

- Check the docs at: [http://docs.mongodb.org/manual/tutorial/control-access-to-mongodb-with-authentication/](http://docs.mongodb.org/manual/tutorial/control-access-to-mongodb-with-authentication/)
- Short version here:
  1. Start `mongod` (without -auth)
  1. Start mongo from the cmd-line as 

            mongo admin
  1. Then create the admin user with 

            db.addUser("<admin-username>", "<admin-password>")
  1. The switch the database to `swk`, which is the database for the app

            use swk
            db.addUser("<app-username>", "<app-password>")
			exit
  1. Shutdown `mongod`
  1. Start `mongod -auth`
  1. Edit `start.sh`, replace the values of `MONGO_USER` and `MONGO_PASS` with `<app-username>` and `<app-password>`

