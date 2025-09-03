FROM node:14-alpine

# Create app directory
WORKDIR /AKENZY/src/app

# Install app dependencies
COPY package*.json ./
COPY yarn.lock ./

RUN yarn install

# Bundle app source
COPY . .

RUN yarn build

EXPOSE 3000
EXPOSE 5000

CMD [ "yarn", "start:prod" ]