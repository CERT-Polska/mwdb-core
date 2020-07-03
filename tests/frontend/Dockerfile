FROM cypress/base:10

WORKDIR /app
COPY ./tests/frontend/cypress.json ./
COPY ./tests/frontend/package.json ./
COPY ./tests/frontend/cypress ./cypress

RUN npm install

CMD npm run test