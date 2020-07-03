FROM cypress/base:10

WORKDIR /app
COPY package.json /app/package.json
RUN npm install

COPY . /app/

CMD ["npm", "run", "test"]
