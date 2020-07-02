# e2e frontend tests

Before you run tests create test files in malwarecage/tests-frontend/integration.

For more information how to write tests visit:
https://docs.cypress.io/

**To run tests:**

From main malwarecage directory:
```
docker-compose -f docker-compose-frontend-tests.yml build
docker-compose -f docker-compose-frontend-tests.yml up --exit-code-from frontend-tests
```

 