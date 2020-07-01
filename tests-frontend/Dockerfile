FROM cypress/base:10

WORKDIR /app
COPY ./tests-frontend/cypress.json ./
COPY ./tests-frontend/package.json ./
COPY ./tests-frontend/cypress ./cypress

RUN npm install cypress --save-dev

RUN ["./node_modules/.bin/cypress", "run"]