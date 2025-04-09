FROM --platform=linux/amd64 node:18
# FROM node:11.12.0-alpine

# create an app directory and use it as working directory
RUN mkdir -p /tasks
WORKDIR /tasks

# setting up directory for node_modules to bin path so that containers folder can be used
ENV PATH /tasks/node_modules/.bin:$PATH

COPY package.json /tasks/package.json
RUN npm install --legacy-peer-deps

RUN npm install pm2@latest -g
RUN npm install db-migrate -g
RUN npm install cross-env -g

COPY . /tasks

# allow port 3210 to be publicly available
EXPOSE 2003
EXPOSE 2010

# run command
CMD pm2 start pm2.json && tail -f /dev/null
