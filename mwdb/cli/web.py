import os
import pathlib
import shutil
import subprocess
import tempfile

from mwdb.cli.base import logger
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
    paths_to_ignore = ["node_modules", ".gitignore"]

    with tempfile.TemporaryDirectory() as context_dirname:
        # Copy files to context directory
        logger.info("Creating build context...")
        dst = pathlib.Path(context_dirname)
        for path in pathlib.Path(web_package_dir).iterdir():
            if path.name in paths_to_ignore:
                continue
            if path.is_file():
                shutil.copy(path, dst / path.name)
            elif path.is_dir():
                shutil.copytree(path, dst / path.name)
            else:
                raise RuntimeError(
                    f"Critical error: file {path} is not a regular file "
                    "nor directory"
                )

        # Run npm install for web core
        logger.info("Installing dependencies")
        if subprocess.call("npm install", shell=True, cwd=context_dirname):
            raise BuildWebError("'npm install' command failed")

        # Run npm install for plugins
        for plugin, web_plugin_path in discover_web_plugins():
            logger.info("Installing web plugin '%s'", plugin)
            if subprocess.call(
                f"npm install {web_plugin_path}", shell=True, cwd=context_dirname
            ):
                raise BuildWebError(f"'npm install {web_plugin_path}' command failed")

        # Run npm run build
        logger.info("Building web application")
        if subprocess.call("npm run build", shell=True, cwd=context_dirname):
            raise BuildWebError("'npm run build' command failed")

        if os.path.exists(target_dir):
            logger.info("Target %s exists, removing", target_dir)
            shutil.rmtree(target_dir)

        logger.info("Collecting artifacts to %s", target_dir)
        shutil.move(os.path.join(context_dirname, "dist"), target_dir)
        logger.info("Web application built successfully!")
