FROM python:3.7
FROM cypress/base:10

WORKDIR /app
COPY package.json /app/package.json
RUN npm install

COPY . /app/

CMD ["python3", "create_test_data.py"]

CMD ["npm", "run", "test"]
