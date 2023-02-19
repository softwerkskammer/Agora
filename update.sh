#!/bin/sh
git pull
#npm ci
yarn install -frozen-lockfile
git checkout -- yarn.lock
grunt deploy_production
