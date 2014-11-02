#!/bin/sh
git pull
npm install
npm prune
grunt deploy_production
