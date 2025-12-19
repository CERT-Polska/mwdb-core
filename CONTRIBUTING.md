# Contributing guidelines

## How to start?

Great, so you want to join the development!

First, [set up a development environment](https://mwdb.readthedocs.io/en/latest/developer-guide.html).
Since you're going to write a new code, we recommend using the `docker-compose-dev.yml` method.

If everything went right, the system should be accessible at `http://localhost:80`.

## Development workflow

We use a standard [github fork workflow](
https://gist.github.com/Chaser324/ce0505fbed06b947d962).

1. Fork the repository.

2. Create a new branch. The name does not matter, but the recommended format
  is `feature/xxx` or `fix/yyy`.

3. Work on your changes!

4. If possible, add a test or two to the `tests/` directory.

5. Remember to autoformat your code. 
   
   For Python code, install exact versions of formatters from https://github.com/CERT-Polska/lint-python-action.
   Then use formatters and linters listed below.
   ```
   isort mwdb/
   black mwdb/
   flake8 mwdb/
   ```
   
   For JS code, use Prettier.
   ```
   cd mwdb/web
   npm install --only=dev
   npx prettier --write src/
   ```

6. If setup.py version matches the latest release version: 
   include version bump in your commit according to the [semantic versioning](https://semver.org)
   
   e.g.
   ```
   python3 dev/bump_version 1.2.3
   ```
   
   - Bump MAJOR version (2.2.2 => 3.0.0) when your change breaks the API compatibility.
   - Bump MINOR version (2.2.2 => 2.3.0) when you add functionality in a backwards compatible manner.
   - Bump PATCH version (2.2.2 => 2.2.3) when you provide a bug fix.
   
   Version bump should be included in the same PR.

7. When you feel like you're done, commit the files:

```bash
$ git add -A
$ git status  # check if included files match your expectations
$ git diff --cached  # check the diff for forgotten debug prints etc
$ git commit  # commit the changes (don't forget to add a commit message)
```

7. Push changes to your fork:

```
$ git push origin [your_branch_name]
```

8. Create a pull request with your changes from the GitHub interface and
   wait for review.

That's it! Thank you very much, we appreciate you help.

## Running tests manually

1. Run Docker-Compose environment (e.g. dev)

```
docker-compose -f docker-compose-dev.yml up -d
```

2. Go to `tests/backend` and install necessary requirements using pip or uv (recommended)

```
(venv) tests/backend$ pip install -r requirements.txt 
```

```
tests/backend$ uv sync
```

3. Export variables from `mwdb-vars.env` and set `MWDB_URL` to API endpoint

```
(venv) tests/backend$ export MWDB_ADMIN_LOGIN=admin
(venv) tests/backend$ export MWDB_ADMIN_PASSWORD=(password)
(venv) tests/backend$ export MWDB_URL=http://127.0.0.1/api
```

4. Run `pytest` to perform tests

```
(venv) tests/backend$ pytest -k attributes
========================================================================================================= test session starts ==========================================================================================================
platform linux -- Python 3.8.10, pytest-6.2.5, py-1.10.0, pluggy-1.0.0
rootdir: /home/psrok1/mwdb-core
collected 78 items / 72 deselected / 6 selected                                                                                                                                                                                        

test_attributes.py ......                                                                                                                                                                                                        [100%]

=================================================================================================== 6 passed, 72 deselected in 3.64s ===================================================================================================
```
