#!/bin/sh
git pull
yarn install --immutable
git checkout -- yarn.lock
yarn deploy
