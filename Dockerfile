FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Bundle app source
COPY . .

# Build the application
RUN yarn build

# Expose ports
EXPOSE 3000
EXPOSE 5000

# Start the application
CMD [ "yarn", "start:dev" ]