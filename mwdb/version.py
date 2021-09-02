try:
    with open(".git/refs/heads/master", "r") as f:
        git_revision = f.read()[:8]
except IOError:
    git_revision = ""

app_version = "2.5.1"
app_build_version = f"{app_version}+{git_revision}" if git_revision else app_version
