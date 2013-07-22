Neuesten Code einspielen
========================
$ git pull upstream master

Benutzerauthentifizierung in der mongo-Shell
============================================
frankdeberle@Franks-MacBook-Pro : ~
$ mongo
MongoDB shell version: 2.4.2
connecting to: test

> use swk
switched to db swk

> db.auth("agora", "agora")
1

> show collections
activitystore
announcementstore
groupstore
memberstore
sessions
system.indexes
system.users
teststore
teststore1
teststore2

Alle anzeigen:
> db.announcementstore.find()

oder:
> db.memberstore.find().pretty()

Update:
db.collection.update(query, update[, options])
> db.announcementstore.update({"url": "test11"}, { $set: { "thruDate": 1375221600 }})

Datensatz Löschen:
> db.announcementstore.remove({"url":"test11"});

Remove All Documents from a Collection
> db.announcementstore.remove()

Rename:
> db.announcementstore.update( { id: 'Frank_Deberle_Test_11_1372751962350' }, { $rename: { 'text': 'message' } } )

Coverage Report erzeugen
========================

$ grunt coverage

--> generiert file:///Users/frankdeberle/git/swk-agora/NeuePlattform-Implementierung/docs/generated/coverage.html
