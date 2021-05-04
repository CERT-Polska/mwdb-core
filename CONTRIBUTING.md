# Contributing guidelines

## How to start?

Great, so you want to join the development!

First, [set up a development environment](INSTALL.md).
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
   
   For Python code, use formatters and linters listed below.
   ```
   pip install -r dev-requirements.txt
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
