#!/bin/sh
git pull
yarn workspaces focus --production
# yarn install --immutable
git checkout -- yarn.lock
yarn deploy
