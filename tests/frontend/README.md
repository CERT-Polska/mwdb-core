# e2e frontend tests

Before you run tests create test files in malwarecage/tests/frontend/integration.

For more information how to write tests visit:
https://docs.cypress.io/

**To run tests:**

- Put your login and password in /plugins/index.js
- Change baseUrl in cypress.json to 127.0.0.1

Tests are included in e2e tests package and can be run from there:
```
sudo docker-compose -f docker-compose-e2e.yml down
sudo docker-compose -f docker-compose-e2e.yml build web-tests
sudo docker-compose -f docker-compose-e2e.yml up web-tests
```
 