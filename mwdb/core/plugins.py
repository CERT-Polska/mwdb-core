import contextlib
import importlib
import pkgutil
import sys
from typing import Type

from mwdb.core.app import api, app
from mwdb.core.config import app_config
from mwdb.core.hooks import HookHandler, register_hook_handler
from mwdb.core.log import getLogger
from mwdb.core.util import is_subdir

logger = getLogger()

loaded_plugins = {}
openid_provider_classes = {}
PluginHookHandler = HookHandler


class PluginAppContext(object):
    def register_hook_handler(self, hook_handler_cls: Type["PluginHookHandler"]):
        register_hook_handler(hook_handler_cls())

    def register_resource(self, resource, *urls, **kwargs):
        api.add_resource(resource, *urls, **kwargs)

    def register_converter(self, converter_name, converter):
        app.url_map.converters[converter_name] = converter

    def register_schema_spec(self, schema_name, schema):
        api.spec.components.schema(schema_name, schema=schema)

    def register_openid_provider_class(self, provider_name, provider_class):
        openid_provider_classes[provider_name] = provider_class


def iter_local_plugin_modules():
    local_plugins_folder = app_config.mwdb.local_plugins_folder
    for module_info in pkgutil.iter_modules():
        if (
            module_info.module_finder
            and getattr(module_info.module_finder, "path", None)
            and is_subdir(local_plugins_folder, module_info.module_finder.path)
        ):
            yield module_info


@contextlib.contextmanager
def local_plugins():
    plugin_list = app_config.mwdb.plugins
    old_syspath = sys.path[:]
    try:
        if app_config.mwdb.local_plugins_folder:
            sys.path.append(app_config.mwdb.local_plugins_folder)
        if app_config.mwdb.local_plugins_autodiscover:
            plugin_list += [
                module_info.name for module_info in iter_local_plugin_modules()
            ]
        yield plugin_list
    finally:
        sys.path = old_syspath


def discover_plugins():
    plugins = {}
    if not app_config.mwdb.enable_plugins:
        logger.info(
            "Plugins will not be loaded because plugins "
            "are not enabled (enable_plugins is 0)."
        )
        return plugins

    with local_plugins() as plugin_list:
        for plugin_name in plugin_list:
            spec = importlib.util.find_spec(plugin_name)
            if not spec:
                raise RuntimeError(f"Plugin package '{plugin_name}' not found")
            plugins[plugin_name] = spec
    return plugins


def load_plugins(app_context: PluginAppContext):
    if not app_config.mwdb.enable_plugins:
        logger.info(
            "Plugins will not be loaded because plugins "
            "are not enabled (enable_plugins is 0)."
        )
        return

    with local_plugins() as plugin_list:
        for plugin_name in plugin_list:
            try:
                plugin = importlib.import_module(plugin_name)
                if (getattr(plugin, "__doc__") or "").startswith(
                    "Karton integration plugin"
                ):
                    logger.warning(
                        "Karton integration features are built-in from v2.3.0. "
                        "Ignoring '%s'...",
                        plugin_name,
                    )
                    continue
                if hasattr(plugin, "__plugin_entrypoint__"):
                    getattr(plugin, "__plugin_entrypoint__")(app_context)
                loaded_plugins[plugin_name] = plugin
                logger.info("Loaded plugin '%s'", plugin_name)
            except Exception:
                logger.exception("Failed to load '%s' plugin", plugin_name)
                raise


def configure_plugins():
    for plugin_name, plugin in loaded_plugins.items():
        try:
            if hasattr(plugin, "__plugin_configure__"):
                getattr(plugin, "__plugin_configure__")()
            logger.info("Configured plugin '%s'", plugin_name)
        except Exception:
            logger.exception("Failed to configure '%s' plugin", plugin_name)
            raise


def get_plugin_info():
    return {
        plugin_name: {
            "active": True,
            "author": getattr(plugin, "__author__", None),
            "version": getattr(plugin, "__version__", None),
            "description": getattr(plugin, "__doc__", None),
        }
        for plugin_name, plugin in loaded_plugins.items()
    }
