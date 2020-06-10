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

5. TODO: autoformatter configuration

6. When you feel like you're done, commit the files:

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
