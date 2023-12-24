#!/bin/sh
git pull
corepack enable
yarn install --immutable
git checkout -- yarn.lock
yarn deploy
