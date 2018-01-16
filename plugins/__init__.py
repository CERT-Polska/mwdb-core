"""
Provides simple plugin system for integration purposes (e.g. with sandboxes).
"""


def from_plugin(plugin_name):
    def decorator(f):
        def method(*args, **kwargs):
            try:
                plugin_module = __import__("plugins.{}".format(plugin_name))
                plugin_module = getattr(plugin_module, plugin_name)
            except ImportError:
                print "Warning: Unable to load plugin '{}'".format(plugin_name)
                return f(*args, **kwargs)
            
            if not hasattr(plugin_module, f.__name__):
                print "Warning: {}.{} not implemented".format(plugin_name, f.__name__)
                return f(*args, **kwargs)

            return getattr(plugin_module, f.__name__)(*args, **kwargs)
        method.__name__ = f.__name__
        return method
    return decorator
