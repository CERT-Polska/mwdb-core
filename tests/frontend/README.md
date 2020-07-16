# e2e frontend tests

**To create tests from cypress dev:**

- Create test files in malwarecage/tests/frontend/integration.

- Set configuration from terminal:
```
export MALWARECAGE_ADMIN_LOGIN="admin"
export MALWARECAGE_ADMIN_PASSWORD="your-password"
```
- Run Malwarecage dev environment.
- Set baseUrl in cypress.json to http://127.0.0.1

- Then run from tests/frontend:
```
npm install cypress --save-dev
```

- To run tests in cypress dev environment :
```
./node_modules/.bin/cypress open
```
- To run tests as they run on docker and CI:
```
./node_modules/.bin/cypress run
```
- To run one test and leave browser open:
```
./node_modules/.bin/cypress run --no-exit --browser chrome --spec cypress/integration/sample.js
```


For more information how to write tests visit:
https://docs.cypress.io/

**To run tests from docker:**

Set baseUrl in cypress.json to http://malwarefront

Tests are included in e2e tests package and can be run from there:
```
sudo docker-compose -f docker-compose-e2e.yml down
sudo docker-compose -f docker-compose-e2e.yml build web-tests
sudo docker-compose -f docker-compose-e2e.yml up web-tests
```
 