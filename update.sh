#!/bin/sh
git pull
#npm ci
yarn install -frozen-lockfile
git checkout -- package-lock.json
grunt deploy_production
