# run mongo database
Start mongo db with `docker-compose up local-mongo`.
The port `27017` is forwarded to the host system.
`initialDBSetup.js` should work just as is. 

A `mongo` directory is created in this folder holding the configuration and data stored in the database.
If you want to start from scratch just delete this folder and restart the container.

To browse the databse with `mongo` from the command line you need to connect to the running docker image.
Run `docker exec -it docker_local-mongo_1 bash` to get a bash inside the container.
From there use `mongo swk` to connect to the database.  

# run local openid provider
Start the container with `docker-compose up local-openid`.
A `local-openid` directory is created that holds the configuration.
You should only have to edit the `config.yml` file in this folder following the documentation [here](https://bogomips.org/local-openid/).

You now can log into the local running Agora entering `http://localhost:4567/` as alternative OpenId provider:  
