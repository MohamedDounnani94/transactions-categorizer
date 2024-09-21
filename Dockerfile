# Common build stage
FROM node:18-alpine AS common-build-stage

COPY . ./app

WORKDIR /app

RUN npm install

# Dvelopment build stage
FROM common-build-stage AS development-build-stage

ENV NODE_ENV development

CMD ["npm", "run", "dev"]

# Production build stage
FROM common-build-stage AS production-build-stage

ENV NODE_ENV production

CMD ["npm", "run", "start"]