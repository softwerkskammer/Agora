#!/bin/sh
git pull
npm install
npm prune
git checkout -- package-lock.json
grunt deploy_production
