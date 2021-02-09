import os
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
    config_paths = [
        "./package.json",
        "./package-lock.json",
        "./config-overrides.js",
        "./public",
        "./src",
    ]

    with tempfile.TemporaryDirectory() as context_dirname:
        # Copy files to context directory
        logger.info("Creating build context...")
        for path in config_paths:
            src = os.path.join(web_package_dir, path)
            dst = os.path.join(context_dirname, path)
            if os.path.isfile(src):
                shutil.copy(src, dst)
            elif os.path.isdir(src):
                shutil.copytree(src, dst)
            else:
                raise RuntimeError(
                    "Critical error: expected file {} doesn't exist".format(path)
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
        shutil.move(os.path.join(context_dirname, "build"), target_dir)
        logger.info("Web application built successfully!")
