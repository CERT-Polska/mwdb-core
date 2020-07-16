FROM cypress/included:4.10.0

WORKDIR /app
COPY package.json /app/package.json
RUN npm install

COPY . /app/

CMD ["npm", "run", "test"]
