# e2e frontend tests

**To run tests from docker:**

Set baseUrl in cypress.json to http://mwdb-web

Tests are included in e2e tests package and can be run from there:
```
docker-compose -f docker-compose-e2e.yml down
docker-compose -f docker-compose-e2e.yml build web-tests
docker-compose -f docker-compose-e2e.yml up web-tests
```

**To create tests from cypress dev:**

- Create test files in tests/frontend/integration.

- Set configuration from terminal (project main directory):
```
source mwdb-vars.env
export MWDB_ADMIN_LOGIN
export MWDB_ADMIN_PASSWORD
```
- Run mwdb-core dev environment.
- Set baseUrl in cypress.json to http://127.0.0.1

- Then run from tests/frontend:
```
npm install
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
 