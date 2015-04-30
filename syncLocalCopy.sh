#!/bin/bash
mkdir -p /home/vagrant/agora
rsync -azq --exclude 'node_modules' --exclude '.git' /vagrant/ /home/vagrant/agora/
find /home/vagrant/agora  -maxdepth 1 -type l -name .git -delete
ln -s /vagrant/.git /home/vagrant/agora/

