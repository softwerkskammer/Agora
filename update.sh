#!/bin/sh
git pull
corepack enable
yarn install --frozen-lockfile
git checkout -- yarn.lock
yarn deploy
