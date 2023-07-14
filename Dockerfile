FROM node:16-alpine as build

LABEL version="0.0.1"
LABEL description="Example Fastify (Node.js) webapp Docker Image"
LABEL maintainer="Chase Ponti <cj@ponti.io>"

# Update packages to reduce risk of vulnerabilities
RUN apk update && apk upgrade

# Switch to app directory
WORKDIR /usr/src/app

# copy project definition/dependencies files, for better reuse of layers
COPY package*.json ./

# Install dependencies here, for better reuse of layers
RUN npm install && npm cache clean --force

# copy all sources in the container (exclusions in .dockerignore file)
COPY . .

# set default node env
ARG NODE_ENV=development

# In order to run tests (for example in CI), do not set production as environment
ENV NODE_ENV=${NODE_ENV}

ENV NPM_CONFIG_LOGLEVEL=warn

# Build application
RUN pnpm build

### cmd stage
FROM node:16-alpine

# Set secure folder permissions
RUN chown node:node /usr/src/app

RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

# Switch to non-privileged user
USER node
COPY package*.json ./
RUN NODE_ENV=production npm install && npm cache clean --force

# This results in a single layer image
FROM node:16-alpine AS release
COPY --from=build /usr/src/app/build ./build

# exposed port/s
EXPOSE 4444

# add an healthcheck, useful
# healthcheck with curl, but not recommended
# HEALTHCHECK CMD curl --fail http://localhost:8000/health || exit 1
# healthcheck by calling the additional script exposed by the plugin
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s CMD pnpm healthcheck-manual

# end.
