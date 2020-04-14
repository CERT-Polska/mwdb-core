# This future import allows methods of Config to use Config as their return type
from typing import TypeVar, List, Optional, Callable, Type, Union, cast
from .provider import ConfigProvider
from .source import ConfigSource
from itertools import dropwhile, islice, chain
import inspect

T = TypeVar('T')
U = TypeVar('U')
V = TypeVar('V')


def _propagate_to_children():
    def propagate_to_children(f):
        def wrapped_f(self, *args, **kwargs):
            child_configs = self.get_registered_composed_config()
            f(self, *args, **kwargs)
            for c in child_configs:
                wrapped_f(c, *args, **kwargs)
        return wrapped_f
    return propagate_to_children


def key(section_name: str=None,
        key_name: str=None,
        required: bool=True,
        cast: Callable[[Union[T, str]], T]=None,
        default: T=None) -> T:
    """
    Provides a getter for a configuration key
    Parameters
    ----------
    section_name: section name where the key resides. If not specified,
        the @section decorator should be used on the Config class to specify it
    key_name: key name within the specified section. If not specified,
        the python key name will be capitalised and used
    required: optional, default True. Whether the key is required or optional
    cast: optional, default None (no cast). Function taking a string argument and returning the parsed value
    default: optional, default None. If required is set to False, the value to use if the config value is not found
    """

    # In general, this should not store any state since the class property is shared across instances. However, the
    # property name will be the same across all instances, so when this is looked up the first time it is ok to store
    # it.
    _mutable_state = {
        'key_name': key_name.upper() if key_name is not None else None
    }

    @property
    def getter(self: Config) -> T:
        """
        Returns
        -------
        value: the parsed config value
        """

        if section_name is None:
            resolved_section_name = self._section_name
            if resolved_section_name is None:
                raise ValueError(
                    "Section name was not specified by the key function or the section class decorator.")
        else:
            resolved_section_name = section_name

        if _mutable_state['key_name'] is None:
            def base_dict_items(cls):
                base = cls
                while True:
                    yield base.__dict__.items()
                    base = base.__base__
                    if base is None:
                        break
            resolved_key_name = list(islice(dropwhile(
                lambda x: x[1] is not getter, chain.from_iterable(base_dict_items(self.__class__))), 1))[0][0]
            _mutable_state['key_name'] = resolved_key_name.upper()

        # If value is cached, just use the cached value
        cached_value = self._provider.get_from_cache(resolved_section_name, _mutable_state['key_name'])
        if cached_value is not None:
            return cached_value

        value = self._provider.get_key(resolved_section_name, _mutable_state['key_name'])

        # If we still haven't found a config value and this parameter is required,
        # raise an exception, otherwise use the default
        if value is None:
            if required:
                raise KeyError("Config parameter {0}.{1} not found".format(resolved_section_name,
                                                                           _mutable_state['key_name']))
            else:
                value = default
        # If a casting function has been specified then cast to the required data type
        if value is not None and cast is not None:
            value = cast(value)

        # Cache this for next time if still not none
        if value is not None:
            self._provider.add_to_cache(resolved_section_name, _mutable_state['key_name'], value)

        return value

    setattr(getter.fget, Config._config_key_registration_string, True)
    return getter


def group_key(cls: Callable[[], U]) -> U:
    """
    Creates a key containing a composed config (or child config) of the configuration. The first time the
    child config is required, it is created and stored in an attribute. This attribute is then used from that
    point onwards.
    Parameters
    ----------
    f - getter function returning a new instance of the child config (usually just the constructor).

    Returns
    -------
    Decorated composed config getter function
    """

    @property
    def wrapped_f(self):
        function_name = cls.__name__
        attr_name = '_' + function_name
        if not hasattr(self, attr_name):
            setattr(self, attr_name, cast(Type[Config], cls)(provider=self._provider))
        return getattr(self, attr_name)

    setattr(wrapped_f.fget, Config._composed_config_registration_string, True)
    return wrapped_f


def section(section_name: str) -> Callable[[Type['Config']], Type['Config']]:
    def _section(cls: Type[Config]):
        class SectionConfig(cls):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, section_name=section_name, **kwargs)
        SectionConfig.__name__ = cls.__name__

        return SectionConfig
    return _section


class Config:
    """
    Base class for all configuration objects
    """
    _composed_config_registration_string = '__composed_config__'
    _config_key_registration_string = '__config_key__'

    def __init__(self, section_name=None, sources: List[ConfigSource]=None,
                 provider: Optional[ConfigProvider]=None):
        self._section_name = section_name
        self._provider: ConfigProvider = provider or ConfigProvider(sources=sources)

    @property
    def config_sources(self) -> List[ConfigSource]:
        return self._provider.config_sources

    @property
    def provider(self) -> ConfigProvider:
        return self._provider

    def get_registered_properties(self) -> List[str]:
        """
        Gets a list of all properties which have been defined using the key function
        Returns
        -------
        A list of strings giving the names of the registered properties/methods
        """
        all_properties = inspect.getmembers(self.__class__, predicate=lambda x: self.is_member_registered(
            x, Config._config_key_registration_string))
        return [f[0] for f in all_properties]

    @staticmethod
    def is_member_registered(member, reg_string: str):
        if isinstance(member, property):
            return getattr(member.fget, reg_string, False)
        else:
            return False

    def get_registered_composed_config(self) -> List['Config']:
        """
        Gets a list of all composed configs or "sub configs",
        that is configs which are registered with the group_key function.
        This returns the sub-config instances themselves (not just references to the getter methods)
        Returns
        -------
        A list of Config subclasses which have been registered
        """

        all_properties = inspect.getmembers(self.__class__, predicate=lambda x: self.is_member_registered(
            x, Config._composed_config_registration_string))
        return [getattr(self, f[0]) if isinstance(f[1], property) else f[1](self) for f in all_properties]

    @_propagate_to_children()
    def read(self):
        """
        Loops through all config properties generated with the key function and reads their values in.
        It is useful to call this after adding the config sources for fail-fast behaviour, since an error will occur at
        this point if any required config value is missing. It also means all config values are loaded into cache at
        this point so future accesses will be reliable and fast.
        Returns
        -------
        None
        """
        registered_properties = self.get_registered_properties()
        for f in registered_properties:
            getattr(self, f)

    def clear_cache(self):
        """
        Config values are cached the first time they are requested. This means that if, for example, config values are
        coming from a database or API, the call does not need to be made again. This function clears the cache.
        Returns
        -------
        None
        """
        self._provider.clear_cache()

    def add_source(self, source: ConfigSource):
        """
        Adds a configuration source
        Parameters
        ----------
        source: a subclass of ConfigSource which can provide string values for configuration parameters

        Returns
        -------
        None
        """
        self._provider.add_source(source)

    def get_key(self, section_name: str, key_name: str) -> Optional[str]:
        """
        Gets a string configuration key from available sources
        Parameters
        ----------
        section_name: section name where the key resides
        key_name: key name within the specified section

        Returns
        -------
        value: the loaded config value as a string
        """
        return self._provider.get_key(section_name, key_name)
