import functools
import importlib
import pkgutil

from core.app import app, api
from core.config import app_config
from core import log
from model import Object, File, Config, TextBlob

logger = log.getLogger()

_plugin_handlers = []
active_plugins = {}


class PluginAppContext(object):
    def register_hook_handler(self, hook_handler_cls):
        global _plugin_handlers
        _plugin_handlers.append(hook_handler_cls())

    def register_resource(self, resource, *urls, **kwargs):
        api.add_resource(resource, *urls, **kwargs)

    def register_converter(self, converter_name, converter):
        app.url_map.converters[converter_name] = converter

    def register_schema_spec(self, schema_name, schema):
        api.spec.components.schema(schema_name, schema=schema)


def hook_handler_method(meth):
    @functools.wraps(meth)
    def hook_handler(self, *args, **kwargs):
        if self.is_callee:
            meth(self, *args, **kwargs)
        else:
            call_hook(meth.__name__, *args, **kwargs)
    return hook_handler


class PluginHookBase(object):
    def __init__(self, is_callee=False):
        self.is_callee = is_callee

    @hook_handler_method
    def on_created_object(self, object: Object):
        pass

    @hook_handler_method
    def on_reuploaded_object(self, object: Object):
        pass

    @hook_handler_method
    def on_created_file(self, file: File):
        pass

    @hook_handler_method
    def on_reuploaded_file(self, file: File):
        pass

    @hook_handler_method
    def on_created_config(self, config: Config):
        pass

    @hook_handler_method
    def on_reuploaded_config(self, config: Config):
        pass

    @hook_handler_method
    def on_created_text_blob(self, blob: TextBlob):
        pass

    @hook_handler_method
    def on_reuploaded_text_blob(self, blob: TextBlob):
        pass


class PluginHookHandler(PluginHookBase):
    def __init__(self):
        super().__init__(True)


def load_plugins(app_context: PluginAppContext):
    if not app_config.malwarecage.enable_plugins:
        logger.info("Plugins will not be loaded because enable_plugins is disabled.")
        return

    try:
        import plugins as ns_plugins
        for finder, name, ispkg in pkgutil.iter_modules(ns_plugins.__path__, ns_plugins.__name__ + "."):
            try:
                plugin = importlib.import_module(name)
                if hasattr(plugin, "__plugin_entrypoint__"):
                    getattr(plugin, "__plugin_entrypoint__")(app_context)
                active_plugins[name.split(".")[1]] = {
                    "active": True,
                    "author": getattr(plugin, "__author__", None),
                    "version": getattr(plugin, "__version__", None),
                    "description": getattr(plugin, "__doc__", None),
                }
            except Exception:
                logger.exception("Failed to load {} plugin".format(name))
                active_plugins[name.split(".")[1]] = {
                    "active": False
                }
    except ImportError:
        logger.exception("Plugins not found, so cannot be loaded.")


def call_hook(hook_name, *args, **kwargs):
    global _plugin_handlers

    if not hasattr(PluginHookBase, hook_name):
        logger.warning('Undefined hook: {}'.format(hook_name))
        return

    if not app_config.malwarecage.enable_hooks:
        logger.info('Hook {} will not be ran because enable_hooks is disabled.'.format(hook_name))
        return

    for hook_handler in _plugin_handlers:
        try:
            fn = getattr(hook_handler, hook_name)
            fn(*args, **kwargs)
        except Exception:
            logger.exception("Hook {} raised exception".format(hook_name))


hooks = PluginHookBase()
