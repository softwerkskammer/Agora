FROM node:6.4
# see https://github.com/nodejs/docker-node/blob/master/Dockerfile-onbuild.template

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app
RUN npm install
COPY . /usr/src/app

EXPOSE 17124 17224
CMD [ "npm", "start" ]
