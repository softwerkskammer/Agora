#!/bin/sh
git pull
npm ci
git checkout -- package-lock.json
grunt deploy_production
