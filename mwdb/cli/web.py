import click
import os
import shutil
import subprocess
import tempfile

from mwdb.core.plugins import discover_plugins
from mwdb.paths import web_package_dir


class BuildWebError(RuntimeError):
    pass


def discover_web_plugins():
    for plugin, spec in discover_plugins().items():
        plugin_path = os.path.abspath(os.path.dirname(spec.origin))
        if os.path.isfile(os.path.join(plugin_path, "package.json")):
            yield plugin, plugin_path


def npm_build_web(target_dir):
    config_paths = [
        "./package.json",
        "./package-lock.json",
        "./config-overrides.js",
        "./public",
        "./src"
    ]

    with tempfile.TemporaryDirectory() as context_dirname:
        # Copy files to context directory
        click.echo(f"[*] Creating build context", err=True)
        for path in config_paths:
            src = os.path.join(web_package_dir, path)
            dst = os.path.join(context_dirname, path)
            if os.path.isfile(src):
                shutil.copy(src, dst)
            elif os.path.isdir(src):
                shutil.copytree(src, dst)
            else:
                raise RuntimeError("Critical error: expected file {} doesn't exist".format(path))

        # Run npm install for web core
        click.echo(f"[*] Installing dependencies", err=True)
        if subprocess.call("npm install", shell=True, cwd=context_dirname):
            raise BuildWebError("'npm install' command failed")

        # Run npm install for plugins
        for plugin, web_plugin_path in discover_web_plugins():
            click.echo(f"[*] Installing web plugin '{plugin}'", err=True)
            if subprocess.call(f"npm install {web_plugin_path}", shell=True, cwd=context_dirname):
                raise BuildWebError(f"'npm install {web_plugin_path}' command failed")

        # Run npm run build
        click.echo(f"[*] Building web application", err=True)
        if subprocess.call("npm run build", shell=True, cwd=context_dirname):
            raise BuildWebError(f"'npm run build' command failed")

        if os.path.exists(target_dir):
            click.echo(f"[*] Target {target_dir} exists, removing...", err=True)
            shutil.rmtree(target_dir)

        click.echo(f"[*] Collecting artifacts to {target_dir}", err=True)
        shutil.move(
            os.path.join(context_dirname, "build"),
            target_dir
        )
        click.echo(f"[+] Done!", err=True)
