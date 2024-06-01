#!/bin/sh
git pull
yarn install --immutable
git checkout -- yarn.lock
yarn deploy
cd /home/swk/plattform/ && node softwerkskammer/lib/migrateToSqlite/migrateAllFromMongo.js
rm -r ~/.cache/puppeteer
